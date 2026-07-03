# emdash-cloudflare-form

EmDash CMS plugin (standard format): a **contact / inquiry form backend** with
**Cloudflare Turnstile** spam protection and **branded HTML email** notifications
delivered through the native [Cloudflare Email Sending](https://developers.cloudflare.com/email-service/)
Workers binding — **no API token, no SMTP, no external SaaS.**

Companion to [`emdash-cloudflare-email`](https://github.com/tmyuu/emdash-cloudflare-email):
that plugin delivers EmDash's own system email; this one owns a public
form-submission endpoint and sends its own branded notifications.

## Features

- **Cloudflare Turnstile** verification (`siteverify`) on every submission.
- **Branded HTML email** to the site owner + an **auto-reply** to the submitter.
  - Configurable **org name, logo, brand colour, footer** — no code edits.
  - **Custom templates** — design your own email HTML from the admin UI with
    a mustache-style syntax (see [Custom templates](#custom-templates)).
- **Flexible fields** — define the form fields (name/label/type/required) from
  the admin UI as JSON. New fields automatically appear in the email.
- **Submission storage** — every submission is saved and viewable in the admin.
- **Bilingual (English / Japanese)** — a single **Language** setting switches
  both the admin UI and the customer-facing output (default field labels,
  email subjects, confirmation message, and the email template text). Defaults
  to English; strings live in `src/i18n.ts`.
- Delivery via the host Worker's `send_email` binding — no API keys.

## Requirements

- EmDash **0.19.0+** (tested up to **0.27**), hosted on **Cloudflare Workers**.
- A `send_email` binding in `wrangler.jsonc`:
  ```jsonc
  { "send_email": [{ "name": "EMAIL" }] }
  ```
- The From domain onboarded to Cloudflare Email Sending
  (`wrangler email sending enable yourdomain.com`).
- A [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) widget
  (site key + secret key).

## Install

```sh
pnpm add github:tmyuu/emdash-cloudflare-form
# (after npm publish: pnpm add emdash-cloudflare-form)
```

## Setup

### 1. Register the plugin in `astro.config.mjs`

```js
import emdash from "emdash/astro";
import cloudflareForm from "emdash-cloudflare-form";

export default defineConfig({
  integrations: [
    emdash({
      // Must be `plugins:` (in-process), NOT `sandboxed:` — the plugin needs
      // the host Worker's `send_email` binding, which is not exposed inside an
      // isolate.
      plugins: [cloudflareForm()],
    }),
  ],
});
```

### 2. Configure in the admin UI

Deploy, then open **EmDash admin → Contact Form**:

- **Language** — `English` / `日本語`. Drives the admin UI and the
  customer-facing output (default fields, subjects, confirmation, email text).
- **Org name / Logo URL / Brand colour / Footer** — email branding.
- **Email font** — CSS `font-family` list used throughout the emails
  (e.g. `'Hiragino Mincho ProN','Yu Mincho',serif`). Email clients ignore
  web fonts, so this reorders system-font fallbacks; blank = the default
  Japanese-safe sans stack.
- **From Address** — `Your Co <noreply@yourdomain.com>` (onboarded domain).
- **Notify recipients** — where submissions are sent (comma/newline separated).
- **Turnstile site key + secret key** — a status line above the form shows
  whether the secret is currently configured (secret fields never display
  their stored value).
- **Auto-reply** toggle + subject.
- **Fields** — JSON array of field definitions (defaults provided).
- **Template** — which HTML design to use:
  - `branded` (default) — solid colour header band + tinted label cells.
  - `custom` — your own design, authored in the two fields below
    (see [Custom templates](#custom-templates)).
- **Custom HTML template / Custom plain-text template** — used when
  Template = Custom. If the HTML field is blank, `branded` is used; if only
  the text field is blank, the default text rendering is used.

### 3. Point your form at the submit endpoint

The form posts JSON (including the Turnstile `token`) to:

```
POST /_emdash/api/plugins/cf-form/submit
```

Response: `{ "ok": true }` on success, or `{ "ok": false, "error": "..." }`
(`turnstile_failed`, `required_fields`, `invalid_email`, `not_configured`,
`send_failed`).

The public form config (active `language`, Turnstile site key, field
definitions, confirmation message) is available at:

```
GET /_emdash/api/plugins/cf-form/config
```

## Custom templates

Selecting the `custom` template renders the admin-authored HTML through a
small mustache-style engine. One template covers both emails — branch on
`{{#isNotify}}` / `{{#isAutoreply}}` where they differ.

Syntax:

| Token | Meaning |
|---|---|
| `{{name}}` | Variable, HTML-escaped (not escaped in the text template) |
| `{{{name}}}` | Variable, raw — for the prebuilt HTML parts |
| `{{#key}}…{{/key}}` | Loop over an array, or render-if-truthy |
| `{{^key}}…{{/key}}` | Render-if-falsy |

Substituted values are inserted exactly once and never re-parsed, so
submitted form data containing `{{…}}` cannot inject template code. A section
cannot nest another section with the same key.

Variables:

| Variable | Content |
|---|---|
| `{{orgName}}` `{{logoUrl}}` `{{brandColor}}` `{{footer}}` `{{siteUrl}}` | Branding settings |
| `{{{footerHtml}}}` | Footer with newlines converted to `<br>` (lines pre-escaped — insert raw) |
| `{{fontFamily}}` | The **Email font** setting (or the default stack) |
| `{{heading}}` | Locale heading for the current email kind |
| `{{greeting}}` | Localized greeting line (empty without a submitter name) |
| `{{category}}` `{{submitterName}}` `{{message}}` | Submission-derived fields |
| `{{field.<name>}}` | Any submitted value by field name (e.g. `{{field.email}}`) |
| `{{#pairs}}{{label}} {{value}}{{/pairs}}` | Loop over non-empty fields (message excluded) |
| `{{isNotify}}` / `{{isAutoreply}}` | Email-kind flags for `{{#…}}` branches |
| `{{preheader}}` `{{htmlLang}}` `{{autoFooterNote}}` `{{inquiryContentLabel}}` `{{{autoreplyBodyHtml}}}` | Locale strings |
| `{{{rows}}}` | Prebuilt field table rows (branded style) |
| `{{{messageBox}}}` | Prebuilt message box (empty when no message) |

Minimal example:

```html
<body style="font-family:{{fontFamily}};">
  <h1>{{heading}}</h1>
  {{#isAutoreply}}<p>{{greeting}}</p><p>{{{autoreplyBodyHtml}}}</p>{{/isAutoreply}}
  <table>{{#pairs}}<tr><td>{{label}}</td><td>{{value}}</td></tr>{{/pairs}}</table>
  {{#message}}<h2>{{inquiryContentLabel}}</h2><p>{{message}}</p>{{/message}}
  <p>{{footer}} — {{orgName}}</p>
</body>
```

## How it works

1. `submit` verifies the Turnstile token, validates fields, stores the
   submission, then sends the owner notification (required) and the submitter
   auto-reply (best-effort) via `env.EMAIL.send`.
2. Email HTML/text is rendered by the selected template in `src/templates.ts`.
3. Settings live in the plugin KV; submissions in plugin storage.

## License

MIT © Yushi Matsui
