import { PluginContext, SandboxedRouteContext } from "emdash/plugin";

//#region src/sandbox-entry.d.ts
type FieldType = "text" | "email" | "tel" | "textarea" | "select";
interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}
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
      initial_value: string;
      placeholder?: undefined;
      multiline?: undefined;
      required?: undefined;
      options?: undefined;
    } | {
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
      multiline: boolean;
      initial_value: string;
      placeholder?: undefined;
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
      multiline: boolean;
      initial_value: string;
      required: boolean;
      placeholder?: undefined;
      options?: undefined;
    } | {
      type: string;
      action_id: string;
      label: string;
      initial_value?: undefined;
      placeholder?: undefined;
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