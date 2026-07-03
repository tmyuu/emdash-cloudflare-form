/**
 * Branded HTML email templates for emdash-cloudflare-form.
 *
 * Two rendering paths:
 *
 *   - `branded` (default) — the built-in design below.
 *   - custom — an admin-authored HTML (and optional plain-text) template
 *     stored in settings and rendered by the small mustache-style engine at
 *     the bottom of this file. This is how sites design their own emails;
 *     see the README for the variable reference.
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
  /**
   * CSS font-family list used throughout the email. Email clients ignore
   * web fonts, so this only reorders system-font fallbacks — but that is
   * enough to match a site's tone (e.g. lead with a mincho/serif stack).
   * Blank = `DEFAULT_FONT_FAMILY`.
   */
  fontFamily?: string;
}

export interface RenderInput {
  kind: EmailKind;
  /** Active language; drives all template text. */
  lang: Lang;
  brand: BrandConfig;
  /** Field label/value pairs in display order. */
  pairs: Array<{ label: string; value: string }>;
  /** Submitted values keyed by field name (for `{{field.<name>}}` tokens). */
  values?: Record<string, string>;
  /** Long-form body (e.g. the message field), rendered in its own box. */
  message?: string;
  /** Submitter display name (for the auto-reply greeting). */
  submitterName?: string;
  /** Inquiry category, shown as a sub-label on the notification. */
  category?: string;
}

export type TemplateFn = (input: RenderInput) => { html: string; text: string };

export const DEFAULT_FONT_FAMILY =
  "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,'Segoe UI',sans-serif";

/**
 * The font stack actually embedded into inline styles. The setting is
 * validated on save, but strip style-breaking characters here too so a
 * value written to KV by other means cannot escape the attribute.
 */
function fontOf(brand: BrandConfig): string {
  const f = brand.fontFamily?.replace(/[<>"{};\\]/g, "").trim();
  return f || DEFAULT_FONT_FAMILY;
}

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
  const font = fontOf(brand);
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
${logo}<span style="display:inline-block;vertical-align:middle;margin-left:${logo ? "12px" : "0"};color:#ffffff;font-family:${font};font-size:16px;font-weight:bold;letter-spacing:.04em;">${escapeHtml(brand.orgName)}</span>
</td></tr>
${inner}
<tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-family:${font};font-size:12px;line-height:1.8;">
${footerLines}${siteLink}<br>${escapeHtml(loc.email.autoFooterNote)}
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function rowsHtml(brand: BrandConfig, pairs: RenderInput["pairs"]): string {
  const accent = brand.brandColor || "#1675b9";
  const font = fontOf(brand);
  return pairs
    .filter((p) => p.value)
    .map(
      (p) => `<tr>
<td style="padding:10px 14px;background:#eef6fd;color:${accent};font-family:${font};font-size:12px;font-weight:bold;white-space:nowrap;vertical-align:top;border-bottom:1px solid #e2e8f0;">${escapeHtml(p.label)}</td>
<td style="padding:10px 14px;color:#1e293b;font-family:${font};font-size:14px;line-height:1.7;border-bottom:1px solid #e2e8f0;word-break:break-all;">${escapeHtml(p.value)}</td>
</tr>`,
    )
    .join("");
}

function messageBox(font: string, message: string): string {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:16px;font-family:${font};font-size:14px;line-height:1.9;color:#1e293b;white-space:pre-wrap;">${escapeHtml(message)}</div>`;
}

/** The default branded design. */
const branded: TemplateFn = (input) => {
  const loc = getLocale(input.lang);
  const accent = input.brand.brandColor || "#1675b9";
  const font = fontOf(input.brand);
  const sub = input.category ? escapeHtml(loc.email.notifySubLabel(input.category, input.submitterName ?? "")) : "";
  let inner: string;
  if (input.kind === "notify") {
    inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 4px;font-family:${font};font-size:18px;color:#0f172a;">${escapeHtml(loc.email.notifyHeading)}</h1>
${sub ? `<p style="margin:0 0 20px;font-family:${font};font-size:13px;color:#64748b;">${sub}</p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-collapse:collapse;">${rowsHtml(input.brand, input.pairs)}</table>
${input.message ? `<p style="margin:22px 0 6px;font-family:${font};font-size:13px;font-weight:bold;color:${accent};">${escapeHtml(loc.email.inquiryContentLabel)}</p>${messageBox(font, input.message)}` : ""}
</td></tr>`;
  } else {
    inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-family:${font};font-size:18px;color:#0f172a;">${escapeHtml(loc.email.autoreplyHeading)}</h1>
${input.submitterName ? `<p style="margin:0 0 14px;font-family:${font};font-size:14px;line-height:1.9;color:#1e293b;">${escapeHtml(loc.email.greeting(input.submitterName))}</p>` : ""}
<p style="margin:0 0 18px;font-family:${font};font-size:14px;line-height:1.9;color:#1e293b;">${loc.email.autoreplyBodyHtml}</p>
${input.message ? `<p style="margin:0 0 6px;font-family:${font};font-size:13px;font-weight:bold;color:${accent};">${escapeHtml(loc.email.inquiryContentLabel)}</p>${messageBox(font, input.message)}` : ""}
</td></tr>`;
  }
  const pre = preheaderOf(input);
  const html = shell(input.lang, input.brand, pre, inner);
  return { html, text: plainText(input) };
};

function preheaderOf(input: RenderInput): string {
  const loc = getLocale(input.lang);
  return input.kind === "notify"
    ? `${input.category ?? ""} ${input.submitterName ?? ""}`.trim() || loc.email.preheaderNew
    : loc.email.preheaderReceived;
}

/** Plain-text body shared by all templates (text/plain alternative part). */
function plainText(input: RenderInput): string {
  const loc = getLocale(input.lang);
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
  return textLines.join("\n");
}

// --- custom template (admin-authored) -----------------------------------------
//
// A minimal mustache-style engine so sites can design their own email HTML
// from the settings page without touching plugin code:
//
//   {{name}}            variable, HTML-escaped (plain in the text template)
//   {{{name}}}          variable, raw (for prebuilt HTML parts)
//   {{#key}}...{{/key}} loop over an array (e.g. pairs) or render-if-truthy
//   {{^key}}...{{/key}} render-if-falsy
//
// Rendering is single-pass over the template source: substituted values are
// never re-scanned, so submitted form data containing `{{...}}` is inert.
// Limitation (documented): a section cannot nest another section of the
// same key.

type TemplateScope = Record<string, unknown>;

export interface CustomTemplate {
  html: string;
  /** Optional plain-text template; blank = the default text rendering. */
  text?: string;
}

function lookupVar(stack: TemplateScope[], path: string): unknown {
  for (let i = stack.length - 1; i >= 0; i--) {
    let cur: unknown = stack[i];
    for (const part of path.split(".")) {
      if (cur !== null && typeof cur === "object" && part in (cur as TemplateScope)) {
        cur = (cur as TemplateScope)[part];
      } else {
        cur = undefined;
        break;
      }
    }
    if (cur !== undefined) return cur;
  }
  return undefined;
}

function renderTemplateString(src: string, stack: TemplateScope[], escape: boolean): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf("{{", i);
    if (open === -1) {
      out += src.slice(i);
      break;
    }
    out += src.slice(i, open);

    // {{{raw}}}
    if (src.startsWith("{{{", open)) {
      const close = src.indexOf("}}}", open + 3);
      if (close === -1) {
        out += src.slice(open);
        break;
      }
      const v = lookupVar(stack, src.slice(open + 3, close).trim());
      out += v == null ? "" : String(v);
      i = close + 3;
      continue;
    }

    const close = src.indexOf("}}", open + 2);
    if (close === -1) {
      out += src.slice(open);
      break;
    }
    const tag = src.slice(open + 2, close).trim();

    // {{#section}} / {{^inverted}}
    if (tag.startsWith("#") || tag.startsWith("^")) {
      const key = tag.slice(1).trim();
      const endTag = `{{/${key}}}`;
      const end = src.indexOf(endTag, close + 2);
      if (end === -1) {
        // Unclosed section: drop the tag and continue.
        i = close + 2;
        continue;
      }
      const inner = src.slice(close + 2, end);
      const v = lookupVar(stack, key);
      const truthy = Array.isArray(v) ? v.length > 0 : Boolean(v);
      if (tag.startsWith("#")) {
        if (Array.isArray(v)) {
          for (const item of v) {
            const scope = item !== null && typeof item === "object" ? (item as TemplateScope) : { ".": item };
            out += renderTemplateString(inner, [...stack, scope], escape);
          }
        } else if (truthy) {
          const scope = v !== null && typeof v === "object" ? [...stack, v as TemplateScope] : stack;
          out += renderTemplateString(inner, scope, escape);
        }
      } else if (!truthy) {
        out += renderTemplateString(inner, stack, escape);
      }
      i = end + endTag.length;
      continue;
    }

    // {{variable}}
    const v = lookupVar(stack, tag);
    const s = v == null ? "" : String(v);
    out += escape ? escapeHtml(s) : s;
    i = close + 2;
  }
  return out;
}

/** Variables exposed to custom templates — see the README reference table. */
function customVars(input: RenderInput): TemplateScope {
  const loc = getLocale(input.lang);
  const brand = input.brand;
  const font = fontOf(brand);
  return {
    orgName: brand.orgName,
    logoUrl: brand.logoUrl ?? "",
    brandColor: brand.brandColor || "#1675b9",
    fontFamily: font,
    footer: brand.footer ?? "",
    siteUrl: brand.siteUrl ?? "",
    htmlLang: loc.email.htmlLang,
    autoFooterNote: loc.email.autoFooterNote,
    preheader: preheaderOf(input),
    heading: input.kind === "notify" ? loc.email.notifyHeading : loc.email.autoreplyHeading,
    greeting: input.submitterName ? loc.email.greeting(input.submitterName) : "",
    autoreplyBodyHtml: loc.email.autoreplyBodyHtml,
    inquiryContentLabel: loc.email.inquiryContentLabel,
    category: input.category ?? "",
    submitterName: input.submitterName ?? "",
    message: input.message ?? "",
    isNotify: input.kind === "notify",
    isAutoreply: input.kind === "autoreply",
    pairs: input.pairs.filter((p) => p.value),
    field: input.values ?? {},
    // Prebuilt parts (insert raw with {{{rows}}} / {{{messageBox}}}).
    rows: rowsHtml(brand, input.pairs),
    messageBox: input.message ? messageBox(font, input.message) : "",
  };
}

export const TEMPLATES: Record<string, TemplateFn> = {
  branded,
  // Site-specific designs belong in the "custom" template (settings page),
  // not here.
};

export function renderEmail(
  templateId: string | undefined,
  input: RenderInput,
  custom?: CustomTemplate,
): { html: string; text: string } {
  if (templateId === "custom" && custom?.html.trim()) {
    const vars = customVars(input);
    return {
      html: renderTemplateString(custom.html, [vars], true),
      text: custom.text?.trim() ? renderTemplateString(custom.text, [vars], false) : plainText(input),
    };
  }
  const fn = (templateId && TEMPLATES[templateId]) || branded;
  return fn(input);
}
