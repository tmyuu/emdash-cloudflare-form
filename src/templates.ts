/**
 * Branded HTML email templates for emdash-cloudflare-form.
 *
 * Templates are a registry keyed by id — add new entries to `TEMPLATES`
 * to offer more designs (selectable from the admin settings page via the
 * "Template" field). Each template renders both a notification (to the
 * site owner) and an auto-reply (to the submitter) from the same data,
 * so adding a form field automatically appears in the email.
 */

export type EmailKind = "notify" | "autoreply";

export interface BrandConfig {
  /** Organisation / site name shown in the header and footer. */
  orgName: string;
  /** Absolute URL to a logo image (PNG recommended for email clients). */
  logoUrl?: string;
  /** Brand accent colour (hex), used for the header band and labels. */
  brandColor: string;
  /** Footer line (address / tel / etc). Plain text; line breaks via "\n". */
  footer?: string;
  /** Optional site URL shown in the footer. */
  siteUrl?: string;
}

export interface RenderInput {
  kind: EmailKind;
  brand: BrandConfig;
  /** Field label/value pairs in display order. */
  pairs: Array<{ label: string; value: string }>;
  /** Long-form body (e.g. the message field), rendered in its own box. */
  message?: string;
  /** Submitter display name (for the auto-reply greeting). */
  submitterName?: string;
  /** Inquiry category, shown as a sub-label on the notification. */
  category?: string;
}

export type TemplateFn = (input: RenderInput) => { html: string; text: string };

const SANS =
  "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,'Segoe UI',sans-serif";

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<
        string,
        string
      >)[c] as string,
  );
}

function shell(brand: BrandConfig, preheader: string, inner: string): string {
  const accent = brand.brandColor || "#1675b9";
  const logo = brand.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" width="34" height="34" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:6px;background:#ffffff;" />`
    : "";
  const footerLines = (brand.footer || "")
    .split("\n")
    .map((l) => escapeHtml(l))
    .join("<br>");
  const siteLink = brand.siteUrl
    ? `<br><a href="${escapeHtml(brand.siteUrl)}" style="color:${accent};text-decoration:none;">${escapeHtml(
        brand.siteUrl.replace(/^https?:\/\//, ""),
      )}</a>`
    : "";
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f1f5f9;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;">
<tr><td style="background:${accent};padding:18px 28px;">
${logo}<span style="display:inline-block;vertical-align:middle;margin-left:${logo ? "12px" : "0"};color:#ffffff;font-family:${SANS};font-size:16px;font-weight:bold;letter-spacing:.04em;">${escapeHtml(brand.orgName)}</span>
</td></tr>
${inner}
<tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-family:${SANS};font-size:12px;line-height:1.8;">
${footerLines}${siteLink}<br>このメールはお問い合わせフォームから自動送信されています。
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function rowsHtml(brand: BrandConfig, pairs: RenderInput["pairs"]): string {
  const accent = brand.brandColor || "#1675b9";
  return pairs
    .filter((p) => p.value)
    .map(
      (p) => `<tr>
<td style="padding:10px 14px;background:#eef6fd;color:${accent};font-family:${SANS};font-size:12px;font-weight:bold;white-space:nowrap;vertical-align:top;border-bottom:1px solid #e2e8f0;">${escapeHtml(p.label)}</td>
<td style="padding:10px 14px;color:#1e293b;font-family:${SANS};font-size:14px;line-height:1.7;border-bottom:1px solid #e2e8f0;word-break:break-all;">${escapeHtml(p.value)}</td>
</tr>`,
    )
    .join("");
}

function messageBox(message: string): string {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:16px;font-family:${SANS};font-size:14px;line-height:1.9;color:#1e293b;white-space:pre-wrap;">${escapeHtml(message)}</div>`;
}

/** The default branded design. */
const branded: TemplateFn = (input) => {
  const accent = input.brand.brandColor || "#1675b9";
  const sub = input.category
    ? `${escapeHtml(input.category)}${input.submitterName ? ` ／ ${escapeHtml(input.submitterName)} 様` : ""}`
    : "";
  let inner: string;
  if (input.kind === "notify") {
    inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 4px;font-family:${SANS};font-size:18px;color:#0f172a;">新しいお問い合わせ</h1>
${sub ? `<p style="margin:0 0 20px;font-family:${SANS};font-size:13px;color:#64748b;">${sub}</p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-collapse:collapse;">${rowsHtml(input.brand, input.pairs)}</table>
${input.message ? `<p style="margin:22px 0 6px;font-family:${SANS};font-size:13px;font-weight:bold;color:${accent};">お問い合わせ内容</p>${messageBox(input.message)}` : ""}
</td></tr>`;
  } else {
    inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-family:${SANS};font-size:18px;color:#0f172a;">お問い合わせありがとうございます</h1>
${input.submitterName ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:14px;line-height:1.9;color:#1e293b;">${escapeHtml(input.submitterName)} 様</p>` : ""}
<p style="margin:0 0 18px;font-family:${SANS};font-size:14px;line-height:1.9;color:#1e293b;">このたびはお問い合わせいただき、誠にありがとうございます。以下の内容で受け付けいたしました。担当者より<strong>2営業日以内</strong>にご返信いたします。</p>
${input.message ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:13px;font-weight:bold;color:${accent};">お問い合わせ内容</p>${messageBox(input.message)}` : ""}
</td></tr>`;
  }
  const pre =
    input.kind === "notify"
      ? `${input.category ?? ""} ${input.submitterName ?? ""}`.trim() || "新しいお問い合わせ"
      : "お問い合わせを受け付けました";
  const html = shell(input.brand, pre, inner);

  const textLines: string[] = [];
  if (input.kind === "autoreply") {
    if (input.submitterName) textLines.push(`${input.submitterName} 様`, "");
    textLines.push(
      "このたびはお問い合わせいただき、誠にありがとうございます。",
      "以下の内容で受け付けいたしました。担当者より2営業日以内にご返信いたします。",
      "",
    );
  } else {
    textLines.push("新しいお問い合わせがありました。", "");
  }
  for (const p of input.pairs) if (p.value) textLines.push(`■ ${p.label}: ${p.value}`);
  if (input.message) textLines.push("", "■ お問い合わせ内容:", input.message);
  textLines.push("", "--", input.brand.orgName);
  return { html, text: textLines.join("\n") };
};

export const TEMPLATES: Record<string, TemplateFn> = {
  branded,
  // 追加デザインはここに増やす: e.g. minimal, card, ...
};

export function renderEmail(
  templateId: string | undefined,
  input: RenderInput,
): { html: string; text: string } {
  const fn = (templateId && TEMPLATES[templateId]) || branded;
  return fn(input);
}
