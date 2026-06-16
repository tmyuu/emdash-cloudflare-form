/**
 * Sandbox entrypoint for emdash-cloudflare-form.
 *
 * Routes:
 *   - `submit`  (public) — verify Turnstile, validate fields, store the
 *                          submission, send a branded HTML notification to
 *                          the site owner + an auto-reply to the submitter,
 *                          all via the Cloudflare Email Sending binding.
 *   - `config`  (public) — expose the public form config (Turnstile site key,
 *                          field definitions, confirmation message) so the
 *                          site can render the form dynamically.
 *   - `admin`            — Block Kit settings page + submissions list.
 *
 * Runtime config lives in the plugin KV (set on the settings page). The host
 * Worker must declare a `send_email` binding (default name `EMAIL`); the
 * plugin must run in-process (`plugins:`), not `sandboxed:`, so the binding
 * is in scope.
 */

import type { PluginContext, SandboxedPlugin, SandboxedRouteContext, SandboxedRequest } from "emdash/plugin";
import { env as cfEnv } from "cloudflare:workers";
import { renderEmail, type BrandConfig } from "./templates.js";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_BINDING = "EMAIL";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- KV keys -----------------------------------------------------------------
const K = {
  orgName: "settings:orgName",
  logoUrl: "settings:logoUrl",
  brandColor: "settings:brandColor",
  footer: "settings:footer",
  siteUrl: "settings:siteUrl",
  fromAddress: "settings:fromAddress",
  bindingName: "settings:bindingName",
  toEmails: "settings:toEmails",
  turnstileSecret: "settings:turnstileSecret",
  turnstileSiteKey: "settings:turnstileSiteKey",
  autoresponder: "settings:autoresponder",
  notifySubject: "settings:notifySubject",
  autoresponderSubject: "settings:autoresponderSubject",
  template: "settings:template",
  confirmMessage: "settings:confirmMessage",
  fields: "settings:fields",
} as const;

// --- Field definitions -------------------------------------------------------
type FieldType = "text" | "email" | "tel" | "textarea" | "select";
interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}

const DEFAULT_FIELDS: FieldDef[] = [
  { name: "type", label: "お問い合わせ種別", type: "select", options: ["施工のご依頼・お見積り", "採用について", "協力会社のご相談", "取材・メディア", "その他"] },
  { name: "name", label: "お名前", type: "text", required: true },
  { name: "kana", label: "フリガナ", type: "text" },
  { name: "company", label: "会社名・所属", type: "text" },
  { name: "email", label: "メールアドレス", type: "email", required: true },
  { name: "tel", label: "電話番号", type: "tel" },
  { name: "message", label: "お問い合わせ内容", type: "textarea", required: true },
];

function parseFields(raw: string): FieldDef[] {
  if (!raw.trim()) return DEFAULT_FIELDS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_FIELDS;
    const ok = parsed.every(
      (f) => f && typeof f.name === "string" && typeof f.label === "string" && typeof f.type === "string",
    );
    return ok ? (parsed as FieldDef[]) : DEFAULT_FIELDS;
  } catch {
    return DEFAULT_FIELDS;
  }
}

// --- helpers -----------------------------------------------------------------
function clip(v: unknown, max: number): string {
  return (v ?? "").toString().trim().slice(0, max);
}
function splitList(s: string): string[] {
  return s
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter((x) => EMAIL_RE.test(x));
}
type FromAddress = { email: string; name?: string };
function parseFrom(input: string): FromAddress | null {
  const m = input.match(/^\s*(?:(.+?)\s*<\s*([^>]+?)\s*>|([^\s<>]+))\s*$/);
  if (!m) return null;
  const email = (m[2] ?? m[3] ?? "").trim();
  if (!EMAIL_RE.test(email)) return null;
  const name = m[1]?.trim().replace(/^"|"$/g, "");
  return name ? { email, name } : { email };
}

type SendEmailBinding = {
  send(message: {
    to: string | string[];
    from: FromAddress | string;
    replyTo?: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<unknown>;
};
function getBinding(name: string): SendEmailBinding {
  const env = cfEnv as unknown as Record<string, unknown>;
  const binding = env[name] as SendEmailBinding | undefined;
  if (!binding || typeof binding.send !== "function") {
    throw new Error(
      `Cloudflare Email Sending binding "${name}" not found on env. Add { "send_email": [{ "name": "${name}" }] } to wrangler config and run the plugin in-process (plugins:, not sandboxed:).`,
    );
  }
  return binding;
}

async function getStr(ctx: PluginContext, key: string, def = ""): Promise<string> {
  const v = await ctx.kv.get<string>(key);
  return typeof v === "string" && v.length > 0 ? v : def;
}

interface Config {
  brand: BrandConfig;
  from: string;
  bindingName: string;
  toEmails: string[];
  turnstileSecret: string;
  turnstileSiteKey: string;
  autoresponder: boolean;
  notifySubject: string;
  autoresponderSubject: string;
  template: string;
  confirmMessage: string;
  fields: FieldDef[];
}

async function loadConfig(ctx: PluginContext): Promise<Config> {
  return {
    brand: {
      orgName: await getStr(ctx, K.orgName, "お問い合わせ"),
      logoUrl: await getStr(ctx, K.logoUrl),
      brandColor: await getStr(ctx, K.brandColor, "#1675b9"),
      footer: await getStr(ctx, K.footer),
      siteUrl: await getStr(ctx, K.siteUrl),
    },
    from: await getStr(ctx, K.fromAddress),
    bindingName: (await getStr(ctx, K.bindingName, DEFAULT_BINDING)) || DEFAULT_BINDING,
    toEmails: splitList(await getStr(ctx, K.toEmails)),
    turnstileSecret: await getStr(ctx, K.turnstileSecret),
    turnstileSiteKey: await getStr(ctx, K.turnstileSiteKey),
    autoresponder: (await getStr(ctx, K.autoresponder)) === "1",
    notifySubject: await getStr(ctx, K.notifySubject, "【お問い合わせ】{type} / {name} 様"),
    autoresponderSubject: await getStr(ctx, K.autoresponderSubject, "お問い合わせを受け付けました"),
    template: await getStr(ctx, K.template, "branded"),
    confirmMessage: await getStr(ctx, K.confirmMessage),
    fields: parseFields(await getStr(ctx, K.fields)),
  };
}

// --- submit route ------------------------------------------------------------
async function verifyTurnstile(secret: string, token: string, ip?: string): Promise<boolean> {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return false;
    const r = (await res.json()) as { success?: boolean };
    return r.success === true;
  } catch {
    return false;
  }
}

// headers は sandboxed では Record<string,string>、trusted(in-process)では
// 実 Headers の場合がある。両対応で安全に読む。
function getHeader(req: SandboxedRequest, name: string): string | undefined {
  const h = req.headers as unknown as { get?: (n: string) => string | null } & Record<string, string>;
  if (typeof h.get === "function") return h.get(name) ?? undefined;
  return h[name] ?? h[name.toLowerCase()] ?? undefined;
}

async function handleSubmit(routeCtx: SandboxedRouteContext, ctx: PluginContext) {
  const cfg = await loadConfig(ctx);
  const from = parseFrom(cfg.from);
  if (!cfg.turnstileSecret || !from || cfg.toEmails.length === 0) {
    return { ok: false, error: "not_configured" };
  }

  const body = (routeCtx.input ?? {}) as Record<string, unknown>;
  const token = clip(body.token ?? body["cf-turnstile-response"], 4000);
  if (!token) return { ok: false, error: "turnstile_missing" };

  // collect + validate fields
  const values: Record<string, string> = {};
  for (const f of cfg.fields) {
    const v = clip(body[f.name], f.type === "textarea" ? 5000 : 500);
    values[f.name] = v;
    if (f.required && !v) return { ok: false, error: "required_fields", field: f.name };
    if (f.type === "email" && v && !EMAIL_RE.test(v)) return { ok: false, error: "invalid_email", field: f.name };
  }

  const ip = getHeader(routeCtx.request, "cf-connecting-ip");
  if (!(await verifyTurnstile(cfg.turnstileSecret, token, ip))) {
    return { ok: false, error: "turnstile_failed" };
  }

  // derive special fields
  const emailField = cfg.fields.find((f) => f.type === "email");
  const textareaField = cfg.fields.find((f) => f.type === "textarea");
  const selectField = cfg.fields.find((f) => f.type === "select") ?? cfg.fields.find((f) => f.name === "type");
  const nameField = cfg.fields.find((f) => f.name === "name") ?? cfg.fields.find((f) => f.type === "text");
  const submitterEmail = emailField ? values[emailField.name] : "";
  const submitterName = nameField ? values[nameField.name] : "";
  const category = selectField ? values[selectField.name] : "";
  const message = textareaField ? values[textareaField.name] : "";

  const pairs = cfg.fields
    .filter((f) => f.type !== "textarea")
    .map((f) => ({ label: f.label, value: values[f.name] ?? "" }));

  // store submission (best-effort; do not fail the request on storage error)
  try {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await ctx.storage.submissions!.put(id, {
      values,
      category,
      submitterEmail,
      submitterName,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    ctx.log.error("Failed to store submission", err as Error);
  }

  const subjectTokens = (s: string) =>
    s.replace(/\{type\}/g, category || "お問い合わせ").replace(/\{name\}/g, submitterName || "");

  const binding = getBinding(cfg.bindingName);

  // notification to site owner(s) — required
  try {
    const mail = renderEmail(cfg.template, { kind: "notify", brand: cfg.brand, pairs, message, submitterName, category });
    await binding.send({
      to: cfg.toEmails,
      from,
      replyTo: submitterEmail || undefined,
      subject: subjectTokens(cfg.notifySubject),
      html: mail.html,
      text: mail.text,
    });
  } catch (err) {
    ctx.log.error("Failed to send notification email", err as Error);
    return { ok: false, error: "send_failed" };
  }

  // auto-reply to submitter — best-effort
  if (cfg.autoresponder && submitterEmail) {
    try {
      const mail = renderEmail(cfg.template, { kind: "autoreply", brand: cfg.brand, pairs, message, submitterName, category });
      await binding.send({
        to: submitterEmail,
        from,
        replyTo: cfg.toEmails[0],
        subject: cfg.autoresponderSubject,
        html: mail.html,
        text: mail.text,
      });
    } catch (err) {
      ctx.log.error("Failed to send auto-reply", err as Error);
    }
  }

  return { ok: true, message: cfg.confirmMessage || undefined };
}

// --- config route (public) ---------------------------------------------------
async function handleConfig(_routeCtx: SandboxedRouteContext, ctx: PluginContext) {
  const cfg = await loadConfig(ctx);
  return {
    turnstileSiteKey: cfg.turnstileSiteKey,
    confirmMessage: cfg.confirmMessage,
    fields: cfg.fields,
  };
}

// --- admin (Block Kit) -------------------------------------------------------
async function buildSettingsPage(ctx: PluginContext) {
  const cfg = await loadConfig(ctx);
  return {
    blocks: [
      { type: "header", text: "お問い合わせフォーム設定" },
      {
        type: "section",
        text: "Cloudflare Turnstile でスパムを防ぎ、Cloudflare Email Sending（send_email バインディング）でブランドHTMLメールを通知します。送信ドメインは Email Sending に onboard 済みである必要があります。",
      },
      {
        type: "form",
        submit: { label: "保存", action_id: "save_settings" },
        fields: [
          { type: "text_input", action_id: "orgName", label: "組織名（ヘッダ・フッタ表示）", initial_value: cfg.brand.orgName },
          { type: "text_input", action_id: "logoUrl", label: "ロゴ画像URL（PNG推奨・絶対URL）", placeholder: "https://example.com/icon.png", initial_value: cfg.brand.logoUrl ?? "" },
          { type: "text_input", action_id: "brandColor", label: "ブランドカラー（hex）", placeholder: "#1675b9", initial_value: cfg.brand.brandColor },
          { type: "text_input", action_id: "footer", label: "フッタ（住所・TEL等／改行可）", multiline: true, initial_value: cfg.brand.footer ?? "" },
          { type: "text_input", action_id: "siteUrl", label: "サイトURL（フッタリンク）", initial_value: cfg.brand.siteUrl ?? "" },
          { type: "text_input", action_id: "fromAddress", label: "差出人 From（name@domain か Name <name@domain>）", placeholder: "有限会社○○ <noreply@example.com>", initial_value: cfg.from, required: true },
          { type: "text_input", action_id: "toEmails", label: "通知先メール（カンマ/改行区切りで複数可）", multiline: true, initial_value: cfg.toEmails.join("\n"), required: true },
          { type: "text_input", action_id: "bindingName", label: "send_email バインディング名", placeholder: DEFAULT_BINDING, initial_value: (cfg.bindingName === DEFAULT_BINDING ? "" : cfg.bindingName) },
          { type: "text_input", action_id: "turnstileSiteKey", label: "Turnstile サイトキー（公開）", initial_value: cfg.turnstileSiteKey },
          { type: "secret_input", action_id: "turnstileSecret", label: "Turnstile シークレットキー（空欄=変更なし）" },
          { type: "text_input", action_id: "notifySubject", label: "通知メール件名（{type}/{name} 使用可）", initial_value: cfg.notifySubject },
          { type: "toggle", action_id: "autoresponder", label: "送信者へ自動返信を送る", initial_value: cfg.autoresponder },
          { type: "text_input", action_id: "autoresponderSubject", label: "自動返信の件名", initial_value: cfg.autoresponderSubject },
          { type: "select", action_id: "template", label: "メールテンプレート", initial_value: cfg.template, options: [{ value: "branded", label: "Branded（標準）" }] },
          { type: "text_input", action_id: "confirmMessage", label: "送信完了メッセージ（任意）", multiline: true, initial_value: cfg.confirmMessage },
          { type: "text_input", action_id: "fields", label: "フィールド定義（JSON配列・空=既定）", multiline: true, initial_value: JSON.stringify(cfg.fields, null, 2) },
        ],
      },
    ],
  };
}

async function saveSettings(ctx: PluginContext, values: Record<string, unknown>) {
  try {
    const setStr = async (key: string, v: unknown) => {
      const s = typeof v === "string" ? v.trim() : "";
      if (s) await ctx.kv.set(key, s);
      else await ctx.kv.delete(key);
    };

    if (typeof values.fromAddress === "string" && !parseFrom(values.fromAddress)) {
      return { ...(await buildSettingsPage(ctx)), toast: { message: "From は name@domain か Name <name@domain> 形式で入力してください", type: "error" } };
    }
    if (typeof values.fields === "string" && values.fields.trim()) {
      try {
        const p = JSON.parse(values.fields);
        if (!Array.isArray(p)) throw new Error("not array");
      } catch {
        return { ...(await buildSettingsPage(ctx)), toast: { message: "フィールド定義が不正なJSONです", type: "error" } };
      }
    }

    await setStr(K.orgName, values.orgName);
    await setStr(K.logoUrl, values.logoUrl);
    await setStr(K.brandColor, values.brandColor);
    await setStr(K.footer, values.footer);
    await setStr(K.siteUrl, values.siteUrl);
    await setStr(K.fromAddress, values.fromAddress);
    await setStr(K.toEmails, values.toEmails);
    await setStr(K.bindingName, values.bindingName);
    await setStr(K.turnstileSiteKey, values.turnstileSiteKey);
    await setStr(K.notifySubject, values.notifySubject);
    await setStr(K.autoresponderSubject, values.autoresponderSubject);
    await setStr(K.template, values.template);
    await setStr(K.confirmMessage, values.confirmMessage);
    await setStr(K.fields, values.fields);
    // toggle → "1" / ""
    if (values.autoresponder === true) await ctx.kv.set(K.autoresponder, "1");
    else await ctx.kv.delete(K.autoresponder);
    // secret: only overwrite when a new value is entered (blank = keep)
    if (typeof values.turnstileSecret === "string" && values.turnstileSecret.trim()) {
      await ctx.kv.set(K.turnstileSecret, values.turnstileSecret.trim());
    }

    return { ...(await buildSettingsPage(ctx)), toast: { message: "設定を保存しました", type: "success" } };
  } catch (err) {
    ctx.log.error("Failed to save contact form settings", err as Error);
    return { ...(await buildSettingsPage(ctx)), toast: { message: "保存に失敗しました", type: "error" } };
  }
}

async function buildSubmissionsPage(ctx: PluginContext) {
  let rows: Array<Record<string, unknown>> = [];
  try {
    const result = await ctx.storage.submissions!.query({ orderBy: { createdAt: "desc" }, limit: 100 });
    rows = (result.items ?? []).map((item: { id: string; data: unknown }) => {
      const d = (item.data ?? {}) as Record<string, unknown>;
      return {
        createdAt: d.createdAt ?? "",
        category: d.category ?? "",
        name: d.submitterName ?? "",
        email: d.submitterEmail ?? "",
      };
    });
  } catch (err) {
    ctx.log.error("Failed to load submissions", err as Error);
  }
  return {
    blocks: [
      { type: "header", text: "お問い合わせ送信履歴" },
      {
        type: "table",
        blockId: "submissions-table",
        columns: [
          { key: "createdAt", label: "受信日時", format: "datetime" },
          { key: "category", label: "種別", format: "text" },
          { key: "name", label: "お名前", format: "text" },
          { key: "email", label: "メール", format: "text" },
        ],
        rows,
      },
    ],
  };
}

type AdminInteraction = {
  type: "page_load" | "form_submit" | string;
  page?: string;
  action_id?: string;
  values?: Record<string, unknown>;
};

async function handleAdmin(routeCtx: SandboxedRouteContext, ctx: PluginContext) {
  const it = routeCtx.input as AdminInteraction;
  if (it.type === "page_load" && it.page === "/submissions") return buildSubmissionsPage(ctx);
  if (it.type === "page_load") return buildSettingsPage(ctx);
  if (it.type === "form_submit" && it.action_id === "save_settings") return saveSettings(ctx, it.values ?? {});
  return { blocks: [] };
}

export default {
  routes: {
    submit: { public: true, handler: handleSubmit },
    config: { public: true, handler: handleConfig },
    admin: { handler: handleAdmin },
  },
} satisfies SandboxedPlugin;
