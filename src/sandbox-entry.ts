/**
 * Sandbox entrypoint for emdash-cloudflare-form.
 *
 * Routes:
 *   - `submit`  (public) — verify Turnstile, validate fields, store the
 *                          submission, send a branded HTML notification to
 *                          the site owner + an auto-reply to the submitter,
 *                          all via the Cloudflare Email Sending binding.
 *   - `config`  (public) — expose the public form config (Turnstile site key,
 *                          field definitions, confirmation message, language)
 *                          so the site can render the form dynamically.
 *   - `admin`            — Block Kit settings page + submissions list.
 *
 * Runtime config lives in the plugin KV (set on the settings page). The host
 * Worker must declare a `send_email` binding (default name `EMAIL`); the
 * plugin must run in-process (`plugins:`), not `sandboxed:`, so the binding
 * is in scope.
 *
 * All human-readable text comes from `src/i18n.ts`, selected by the runtime
 * "Language" setting (default English) which drives both the admin UI and the
 * customer-facing output.
 */

import type { PluginContext, SandboxedPlugin, SandboxedRouteContext, SandboxedRequest } from "emdash/plugin";
import { env as cfEnv } from "cloudflare:workers";
import { renderEmail, type BrandConfig } from "./templates.js";
import {
  getLocale,
  defaultFields,
  normalizeLang,
  DEFAULT_LANG,
  LANGS,
  type Lang,
  type FieldDef,
} from "./i18n.js";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_BINDING = "EMAIL";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- KV keys -----------------------------------------------------------------
const K = {
  language: "settings:language",
  orgName: "settings:orgName",
  logoUrl: "settings:logoUrl",
  brandColor: "settings:brandColor",
  fontFamily: "settings:fontFamily",
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

function parseFields(raw: string, lang: Lang): FieldDef[] {
  if (!raw.trim()) return defaultFields(lang);
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultFields(lang);
    const ok = parsed.every(
      (f) => f && typeof f.name === "string" && typeof f.label === "string" && typeof f.type === "string",
    );
    return ok ? (parsed as FieldDef[]) : defaultFields(lang);
  } catch {
    return defaultFields(lang);
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

/**
 * Cloudflare Email Sending の宛先型。workers-types の EmailAddress は
 * name が**必須**なので、表示名が無い場合はオブジェクトではなく
 * プレーンな文字列（メールアドレスのみ）を渡すこと。
 * {email} だけのオブジェクトを渡すと
 * "Incorrect type for the 'name' field on 'EmailAddress'" で送信が失敗する。
 */
type EmailAddress = { email: string; name: string };
type SendEmailBinding = {
  send(message: {
    to: string | EmailAddress | (string | EmailAddress)[];
    from: string | EmailAddress;
    replyTo?: string | EmailAddress;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<unknown>;
};

/** parseFrom の結果を binding が受け付ける形（文字列 or name 必須オブジェクト）に変換する */
function toSendAddress(parsed: FromAddress, fallbackName?: string): string | EmailAddress {
  const name = parsed.name ?? fallbackName?.trim();
  return name ? { email: parsed.email, name } : parsed.email;
}
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
  lang: Lang;
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
  const lang = normalizeLang(await getStr(ctx, K.language, DEFAULT_LANG));
  const loc = getLocale(lang);
  return {
    lang,
    brand: {
      orgName: await getStr(ctx, K.orgName, loc.defaults.orgName),
      logoUrl: await getStr(ctx, K.logoUrl),
      brandColor: await getStr(ctx, K.brandColor, "#1675b9"),
      fontFamily: await getStr(ctx, K.fontFamily),
      footer: await getStr(ctx, K.footer),
      siteUrl: await getStr(ctx, K.siteUrl),
    },
    from: await getStr(ctx, K.fromAddress),
    bindingName: (await getStr(ctx, K.bindingName, DEFAULT_BINDING)) || DEFAULT_BINDING,
    toEmails: splitList(await getStr(ctx, K.toEmails)),
    turnstileSecret: await getStr(ctx, K.turnstileSecret),
    turnstileSiteKey: await getStr(ctx, K.turnstileSiteKey),
    autoresponder: (await getStr(ctx, K.autoresponder)) === "1",
    notifySubject: await getStr(ctx, K.notifySubject, loc.defaults.notifySubject),
    autoresponderSubject: await getStr(ctx, K.autoresponderSubject, loc.defaults.autoresponderSubject),
    template: await getStr(ctx, K.template, "branded"),
    confirmMessage: await getStr(ctx, K.confirmMessage),
    fields: parseFields(await getStr(ctx, K.fields), lang),
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

// `headers` is a plain Record<string,string> when sandboxed, but may be a real
// Headers object in trusted (in-process) mode. Read safely for both.
function getHeader(req: SandboxedRequest, name: string): string | undefined {
  const h = req.headers as unknown as { get?: (n: string) => string | null } & Record<string, string>;
  if (typeof h.get === "function") return h.get(name) ?? undefined;
  return h[name] ?? h[name.toLowerCase()] ?? undefined;
}

async function handleSubmit(routeCtx: SandboxedRouteContext, ctx: PluginContext) {
  const cfg = await loadConfig(ctx);
  const loc = getLocale(cfg.lang);
  const parsedFrom = parseFrom(cfg.from);
  if (!cfg.turnstileSecret || !parsedFrom || cfg.toEmails.length === 0) {
    return { ok: false, error: "not_configured" };
  }
  // 表示名の無い From はオブジェクトではなく文字列で渡す（EmailAddress.name は必須のため）。
  // 表示名はメール設定の From（`Name <addr>` 形式）→ orgName の順でフォールバック
  const from = toSendAddress(parsedFrom, cfg.brand.orgName);

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
    s.replace(/\{type\}/g, category || loc.defaults.categoryFallback).replace(/\{name\}/g, submitterName || "");

  const binding = getBinding(cfg.bindingName);

  // notification to site owner(s) — required
  try {
    const mail = renderEmail(cfg.template, { kind: "notify", lang: cfg.lang, brand: cfg.brand, pairs, message, submitterName, category });
    await binding.send({
      // 宛先は文字列（配列）が許容される。オブジェクトで渡す場合は name が必須になるため
      // 表示名を持たない宛先はプレーンな文字列のまま渡す
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
      const mail = renderEmail(cfg.template, { kind: "autoreply", lang: cfg.lang, brand: cfg.brand, pairs, message, submitterName, category });
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
    language: cfg.lang,
    turnstileSiteKey: cfg.turnstileSiteKey,
    confirmMessage: cfg.confirmMessage,
    fields: cfg.fields,
  };
}

// --- admin (Block Kit) -------------------------------------------------------
async function buildSettingsPage(ctx: PluginContext) {
  const cfg = await loadConfig(ctx);
  const t = getLocale(cfg.lang).admin;
  return {
    blocks: [
      { type: "header", text: t.settingsTitle },
      {
        type: "section",
        text: t.settingsIntro,
      },
      {
        // secret_input can't display its stored value, so surface whether
        // the Turnstile secret is configured at all.
        type: "section",
        text: cfg.turnstileSecret ? t.turnstileStatusSet : t.turnstileStatusMissing,
      },
      {
        type: "form",
        submit: { label: t.saveButton, action_id: "save_settings" },
        fields: [
          {
            type: "select",
            action_id: "language",
            label: t.languageFieldLabel,
            initial_value: cfg.lang,
            options: LANGS.map((l) => ({ value: l, label: getLocale(l).admin.languageOptionLabel })),
          },
          { type: "text_input", action_id: "orgName", label: t.orgNameLabel, placeholder: t.orgNamePlaceholder, initial_value: cfg.brand.orgName },
          { type: "text_input", action_id: "logoUrl", label: t.logoUrlLabel, placeholder: t.logoUrlPlaceholder, initial_value: cfg.brand.logoUrl ?? "" },
          { type: "text_input", action_id: "brandColor", label: t.brandColorLabel, placeholder: t.brandColorPlaceholder, initial_value: cfg.brand.brandColor },
          { type: "text_input", action_id: "fontFamily", label: t.fontFamilyLabel, placeholder: t.fontFamilyPlaceholder, initial_value: cfg.brand.fontFamily ?? "" },
          { type: "text_input", action_id: "footer", label: t.footerLabel, placeholder: t.footerPlaceholder, multiline: true, initial_value: cfg.brand.footer ?? "" },
          { type: "text_input", action_id: "siteUrl", label: t.siteUrlLabel, placeholder: t.siteUrlPlaceholder, initial_value: cfg.brand.siteUrl ?? "" },
          { type: "text_input", action_id: "fromAddress", label: t.fromAddressLabel, placeholder: t.fromAddressPlaceholder, initial_value: cfg.from, required: true },
          { type: "text_input", action_id: "toEmails", label: t.toEmailsLabel, placeholder: t.toEmailsPlaceholder, multiline: true, initial_value: cfg.toEmails.join("\n"), required: true },
          { type: "text_input", action_id: "bindingName", label: t.bindingNameLabel, placeholder: DEFAULT_BINDING, initial_value: (cfg.bindingName === DEFAULT_BINDING ? "" : cfg.bindingName) },
          { type: "text_input", action_id: "turnstileSiteKey", label: t.turnstileSiteKeyLabel, placeholder: t.turnstileSiteKeyPlaceholder, initial_value: cfg.turnstileSiteKey },
          { type: "secret_input", action_id: "turnstileSecret", label: t.turnstileSecretLabel, placeholder: t.turnstileSecretPlaceholder },
          { type: "text_input", action_id: "notifySubject", label: t.notifySubjectLabel, placeholder: t.notifySubjectPlaceholder, initial_value: cfg.notifySubject },
          { type: "toggle", action_id: "autoresponder", label: t.autoresponderLabel, initial_value: cfg.autoresponder },
          { type: "text_input", action_id: "autoresponderSubject", label: t.autoresponderSubjectLabel, initial_value: cfg.autoresponderSubject },
          { type: "select", action_id: "template", label: t.templateLabel, initial_value: cfg.template, options: [{ value: "branded", label: t.templateBrandedOption }, { value: "elegant", label: t.templateElegantOption }] },
          { type: "text_input", action_id: "confirmMessage", label: t.confirmMessageLabel, placeholder: t.confirmMessagePlaceholder, multiline: true, initial_value: cfg.confirmMessage },
          { type: "text_input", action_id: "fields", label: t.fieldsLabel, placeholder: t.fieldsPlaceholder, multiline: true, initial_value: JSON.stringify(cfg.fields, null, 2) },
        ],
      },
    ],
  };
}

async function saveSettings(ctx: PluginContext, values: Record<string, unknown>) {
  // Persist the language first so validation errors and the re-rendered page
  // reflect the (possibly) newly selected language.
  if (typeof values.language === "string") {
    await ctx.kv.set(K.language, normalizeLang(values.language));
  }
  const t = getLocale(normalizeLang(await getStr(ctx, K.language, DEFAULT_LANG))).admin;
  try {
    const setStr = async (key: string, v: unknown) => {
      const s = typeof v === "string" ? v.trim() : "";
      if (s) await ctx.kv.set(key, s);
      else await ctx.kv.delete(key);
    };

    if (typeof values.fromAddress === "string" && !parseFrom(values.fromAddress)) {
      return { ...(await buildSettingsPage(ctx)), toast: { message: t.toastInvalidFrom, type: "error" } };
    }
    if (typeof values.fontFamily === "string" && /[<>"{};\\]/.test(values.fontFamily)) {
      return { ...(await buildSettingsPage(ctx)), toast: { message: t.toastInvalidFont, type: "error" } };
    }
    if (typeof values.fields === "string" && values.fields.trim()) {
      try {
        const p = JSON.parse(values.fields);
        if (!Array.isArray(p)) throw new Error("not array");
      } catch {
        return { ...(await buildSettingsPage(ctx)), toast: { message: t.toastInvalidFields, type: "error" } };
      }
    }

    await setStr(K.orgName, values.orgName);
    await setStr(K.logoUrl, values.logoUrl);
    await setStr(K.brandColor, values.brandColor);
    await setStr(K.fontFamily, values.fontFamily);
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

    return { ...(await buildSettingsPage(ctx)), toast: { message: t.toastSaved, type: "success" } };
  } catch (err) {
    ctx.log.error("Failed to save contact form settings", err as Error);
    return { ...(await buildSettingsPage(ctx)), toast: { message: t.toastSaveFailed, type: "error" } };
  }
}

async function buildSubmissionsPage(ctx: PluginContext) {
  const cfg = await loadConfig(ctx);
  const t = getLocale(cfg.lang).admin;
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
      { type: "header", text: t.submissionsTitle },
      {
        type: "table",
        blockId: "submissions-table",
        columns: [
          { key: "createdAt", label: t.colReceivedAt, format: "datetime" },
          { key: "category", label: t.colCategory, format: "text" },
          { key: "name", label: t.colName, format: "text" },
          { key: "email", label: t.colEmail, format: "text" },
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
