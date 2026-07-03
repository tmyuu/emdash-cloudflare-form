/**
 * emdash-cloudflare-form
 *
 * EmDash CMS plugin (standard format): a contact / inquiry form backend with
 * Cloudflare Turnstile spam protection and branded HTML email notifications
 * delivered through the native Cloudflare Email Sending Workers binding
 * (`env.EMAIL.send`) — no API token, no SMTP, no external SaaS.
 *
 * Companion to `emdash-cloudflare-email`. Where that plugin delivers EmDash's
 * own system email, this one owns a public form-submission endpoint:
 *
 *   - `src/index.ts`         → this descriptor factory (`PluginDescriptor`)
 *   - `src/sandbox-entry.ts` → routes (submit/config/admin) + storage
 *   - `src/templates.ts`     → branded HTML email templates (extensible)
 *
 * Register it in `astro.config.mjs`:
 *
 *   import emdash from 'emdash/astro';
 *   import cloudflareForm from 'emdash-cloudflare-form';
 *
 *   export default defineConfig({
 *     integrations: [
 *       emdash({
 *         // Must be `plugins:` (in-process), NOT `sandboxed:` — the plugin
 *         // needs the host Worker's `send_email` binding, which is not
 *         // exposed inside an isolate.
 *         plugins: [cloudflareForm()],
 *       }),
 *     ],
 *   });
 *
 * Required wrangler config (host Worker):
 *
 *   "send_email": [{ "name": "EMAIL" }]
 *
 * Everything else (From / recipients / Turnstile keys / fields / branding /
 * email template) is configured at runtime from the plugin's admin settings
 * page and stored in the plugin's KV.
 */

import type { PluginDescriptor } from "emdash";

export function cloudflareForm(): PluginDescriptor {
  return {
    id: "cf-form",
    version: "0.2.0",
    format: "standard",
    entrypoint: "emdash-cloudflare-form/sandbox",
    adminPages: [
      { path: "/settings", label: "Contact Form", icon: "mail" },
      { path: "/submissions", label: "Form Submissions", icon: "inbox" },
    ],
    storage: {
      submissions: {
        indexes: ["createdAt"],
      },
    },
  };
}

export default cloudflareForm;
