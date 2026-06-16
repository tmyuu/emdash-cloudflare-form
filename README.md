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
  - **Extensible template registry** (`src/templates.ts`) — add more designs.
- **Flexible fields** — define the form fields (name/label/type/required) from
  the admin UI as JSON. New fields automatically appear in the email.
- **Submission storage** — every submission is saved and viewable in the admin.
- Delivery via the host Worker's `send_email` binding — no API keys.

## Requirements

- EmDash **0.19.0+**, hosted on **Cloudflare Workers**.
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

- **Org name / Logo URL / Brand colour / Footer** — email branding.
- **From Address** — `Your Co <noreply@yourdomain.com>` (onboarded domain).
- **Notify recipients** — where submissions are sent (comma/newline separated).
- **Turnstile site key + secret key**.
- **Auto-reply** toggle + subject.
- **Fields** — JSON array of field definitions (defaults provided).
- **Template** — which HTML design to use.

### 3. Point your form at the submit endpoint

The form posts JSON (including the Turnstile `token`) to:

```
POST /_emdash/api/plugins/cf-form/submit
```

Response: `{ "ok": true }` on success, or `{ "ok": false, "error": "..." }`
(`turnstile_failed`, `required_fields`, `invalid_email`, `not_configured`,
`send_failed`).

The public form config (Turnstile site key, field definitions, confirmation
message) is available at:

```
GET /_emdash/api/plugins/cf-form/config
```

## How it works

1. `submit` verifies the Turnstile token, validates fields, stores the
   submission, then sends the owner notification (required) and the submitter
   auto-reply (best-effort) via `env.EMAIL.send`.
2. Email HTML/text is rendered by the selected template in `src/templates.ts`.
3. Settings live in the plugin KV; submissions in plugin storage.

## License

MIT © Yushi Matsui
