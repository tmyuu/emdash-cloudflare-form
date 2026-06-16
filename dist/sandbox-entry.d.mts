import { PluginContext, SandboxedRouteContext } from "emdash/plugin";

//#region src/i18n.d.ts
/**
 * i18n for emdash-cloudflare-form.
 *
 * All user-facing strings live here, keyed by language. Application code must
 * NOT hard-code any human-readable text — it reads everything from the active
 * locale returned by `getLocale(lang)`. Add a new language by adding an entry
 * to `LOCALES` (and to `LANGS`).
 *
 * The active language is a runtime setting (admin settings page → "Language")
 * stored in the plugin KV. It drives BOTH the admin UI and the customer-facing
 * output (default field labels, email subjects, confirmation message, and the
 * email template text).
 */
type Lang = "en" | "ja";
type FieldType = "text" | "email" | "tel" | "textarea" | "select";
interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}
//#endregion
//#region src/sandbox-entry.d.ts
declare function handleSubmit(routeCtx: SandboxedRouteContext, ctx: PluginContext): Promise<{
  ok: boolean;
  error: string;
  field?: undefined;
  message?: undefined;
} | {
  ok: boolean;
  error: string;
  field: string;
  message?: undefined;
} | {
  ok: boolean;
  message: string | undefined;
  error?: undefined;
  field?: undefined;
}>;
declare function handleConfig(_routeCtx: SandboxedRouteContext, ctx: PluginContext): Promise<{
  language: Lang;
  turnstileSiteKey: string;
  confirmMessage: string;
  fields: FieldDef[];
}>;
declare function handleAdmin(routeCtx: SandboxedRouteContext, ctx: PluginContext): Promise<{
  blocks: ({
    type: string;
    text: string;
    blockId?: undefined;
    columns?: undefined;
    rows?: undefined;
  } | {
    type: string;
    blockId: string;
    columns: {
      key: string;
      label: string;
      format: string;
    }[];
    rows: Record<string, unknown>[];
    text?: undefined;
  })[];
} | {
  blocks: ({
    type: string;
    text: string;
    submit?: undefined;
    fields?: undefined;
  } | {
    type: string;
    submit: {
      label: string;
      action_id: string;
    };
    fields: ({
      type: string;
      action_id: string;
      label: string;
      placeholder: string;
      initial_value: string;
      multiline?: undefined;
      required?: undefined;
      options?: undefined;
    } | {
      type: string;
      action_id: string;
      label: string;
      placeholder: string;
      multiline: boolean;
      initial_value: string;
      required?: undefined;
      options?: undefined;
    } | {
      type: string;
      action_id: string;
      label: string;
      placeholder: string;
      initial_value: string;
      required: boolean;
      multiline?: undefined;
      options?: undefined;
    } | {
      type: string;
      action_id: string;
      label: string;
      placeholder: string;
      multiline: boolean;
      initial_value: string;
      required: boolean;
      options?: undefined;
    } | {
      type: string;
      action_id: string;
      label: string;
      placeholder: string;
      initial_value?: undefined;
      multiline?: undefined;
      required?: undefined;
      options?: undefined;
    } | {
      type: string;
      action_id: string;
      label: string;
      initial_value: boolean;
      placeholder?: undefined;
      multiline?: undefined;
      required?: undefined;
      options?: undefined;
    } | {
      type: string;
      action_id: string;
      label: string;
      initial_value: string;
      placeholder?: undefined;
      multiline?: undefined;
      required?: undefined;
      options?: undefined;
    } | {
      type: string;
      action_id: string;
      label: string;
      initial_value: string;
      options: {
        value: string;
        label: string;
      }[];
      placeholder?: undefined;
      multiline?: undefined;
      required?: undefined;
    })[];
    text?: undefined;
  })[];
}>;
declare const _default: {
  routes: {
    submit: {
      public: true;
      handler: typeof handleSubmit;
    };
    config: {
      public: true;
      handler: typeof handleConfig;
    };
    admin: {
      handler: typeof handleAdmin;
    };
  };
};
//#endregion
export { _default as default };