/**
 * Branded HTML email templates for emdash-cloudflare-form.
 *
 * Templates are a registry keyed by id — add new entries to `TEMPLATES`
 * to offer more designs (selectable from the admin settings page via the
 * "Template" field). Each template renders both a notification (to the
 * site owner) and an auto-reply (to the submitter) from the same data,
 * so adding a form field automatically appears in the email.
 *
 * All human-readable strings come from the active locale (`src/i18n.ts`),
 * selected by the runtime "Language" setting — no text is hard-coded here.
 */

import { getLocale, type Lang } from "./i18n.js";

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
  /** Active language; drives all template text. */
  lang: Lang;
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

function shell(lang: Lang, brand: BrandConfig, preheader: string, inner: string): string {
  const loc = getLocale(lang);
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
  return `<!doctype html><html lang="${escapeHtml(loc.email.htmlLang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
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
${footerLines}${siteLink}<br>${escapeHtml(loc.email.autoFooterNote)}
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
  const loc = getLocale(input.lang);
  const accent = input.brand.brandColor || "#1675b9";
  const sub = input.category ? escapeHtml(loc.email.notifySubLabel(input.category, input.submitterName ?? "")) : "";
  let inner: string;
  if (input.kind === "notify") {
    inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 4px;font-family:${SANS};font-size:18px;color:#0f172a;">${escapeHtml(loc.email.notifyHeading)}</h1>
${sub ? `<p style="margin:0 0 20px;font-family:${SANS};font-size:13px;color:#64748b;">${sub}</p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-collapse:collapse;">${rowsHtml(input.brand, input.pairs)}</table>
${input.message ? `<p style="margin:22px 0 6px;font-family:${SANS};font-size:13px;font-weight:bold;color:${accent};">${escapeHtml(loc.email.inquiryContentLabel)}</p>${messageBox(input.message)}` : ""}
</td></tr>`;
  } else {
    inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-family:${SANS};font-size:18px;color:#0f172a;">${escapeHtml(loc.email.autoreplyHeading)}</h1>
${input.submitterName ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:14px;line-height:1.9;color:#1e293b;">${escapeHtml(loc.email.greeting(input.submitterName))}</p>` : ""}
<p style="margin:0 0 18px;font-family:${SANS};font-size:14px;line-height:1.9;color:#1e293b;">${loc.email.autoreplyBodyHtml}</p>
${input.message ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:13px;font-weight:bold;color:${accent};">${escapeHtml(loc.email.inquiryContentLabel)}</p>${messageBox(input.message)}` : ""}
</td></tr>`;
  }
  const pre =
    input.kind === "notify"
      ? `${input.category ?? ""} ${input.submitterName ?? ""}`.trim() || loc.email.preheaderNew
      : loc.email.preheaderReceived;
  const html = shell(input.lang, input.brand, pre, inner);

  const textLines: string[] = [];
  if (input.kind === "autoreply") {
    if (input.submitterName) textLines.push(loc.email.greeting(input.submitterName), "");
    textLines.push(...loc.email.autoreplyBodyText);
  } else {
    textLines.push(loc.email.notifyIntroText, "");
  }
  for (const p of input.pairs) if (p.value) textLines.push(`■ ${p.label}: ${p.value}`);
  if (input.message) textLines.push("", `■ ${loc.email.inquiryContentLabel}:`, input.message);
  textLines.push("", "--", input.brand.orgName);
  return { html, text: textLines.join("\n") };
};

export const TEMPLATES: Record<string, TemplateFn> = {
  branded,
  // Add more designs here: e.g. minimal, card, ...
};

export function renderEmail(
  templateId: string | undefined,
  input: RenderInput,
): { html: string; text: string } {
  const fn = (templateId && TEMPLATES[templateId]) || branded;
  return fn(input);
}
