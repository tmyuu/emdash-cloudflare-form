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

export type Lang = "en" | "ja";

/** Supported languages, in the order shown in the settings dropdown. */
export const LANGS: Lang[] = ["en", "ja"];

/** Default language when none has been configured. */
export const DEFAULT_LANG: Lang = "en";

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ja";
}

export function normalizeLang(v: unknown): Lang {
  return isLang(v) ? v : DEFAULT_LANG;
}

// --- field definitions -------------------------------------------------------
export type FieldType = "text" | "email" | "tel" | "textarea" | "select";
export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}

// --- locale shape ------------------------------------------------------------
export interface AdminMessages {
  /** Option label for this language in the language dropdown. */
  languageOptionLabel: string;
  languageFieldLabel: string;

  settingsTitle: string;
  settingsIntro: string;
  saveButton: string;

  // Keep labels short; put the supplementary detail in the matching placeholder.
  orgNameLabel: string;
  orgNamePlaceholder: string;
  logoUrlLabel: string;
  logoUrlPlaceholder: string;
  brandColorLabel: string;
  brandColorPlaceholder: string;
  fontFamilyLabel: string;
  fontFamilyPlaceholder: string;
  footerLabel: string;
  footerPlaceholder: string;
  siteUrlLabel: string;
  siteUrlPlaceholder: string;
  fromAddressLabel: string;
  fromAddressPlaceholder: string;
  toEmailsLabel: string;
  toEmailsPlaceholder: string;
  bindingNameLabel: string;
  turnstileSiteKeyLabel: string;
  turnstileSiteKeyPlaceholder: string;
  turnstileSecretLabel: string;
  turnstileSecretPlaceholder: string;
  notifySubjectLabel: string;
  notifySubjectPlaceholder: string;
  autoresponderLabel: string;
  autoresponderSubjectLabel: string;
  templateLabel: string;
  templateBrandedOption: string;
  templateEditorialOption: string;
  templateElegantOption: string;
  confirmMessageLabel: string;
  confirmMessagePlaceholder: string;
  fieldsLabel: string;
  fieldsPlaceholder: string;

  toastSaved: string;
  toastSaveFailed: string;
  toastInvalidFrom: string;
  toastInvalidFields: string;
  toastInvalidFont: string;

  /** Status line for the Turnstile secret (secret inputs can't show values). */
  turnstileStatusSet: string;
  turnstileStatusMissing: string;

  submissionsTitle: string;
  colReceivedAt: string;
  colCategory: string;
  colName: string;
  colEmail: string;
}

export interface EmailMessages {
  /** `lang` attribute for the HTML document. */
  htmlLang: string;
  /** Auto-sent disclaimer appended to the email footer. */
  autoFooterNote: string;
  notifyHeading: string;
  autoreplyHeading: string;
  inquiryContentLabel: string;
  /** Greeting line for the auto-reply, given the submitter name. */
  greeting: (name: string) => string;
  /** Sub-label under the notification heading (category / name). */
  notifySubLabel: (category: string, name: string) => string;
  /** Auto-reply body paragraph (HTML; may contain inline markup). */
  autoreplyBodyHtml: string;
  /** Auto-reply body paragraph (plain-text lines). */
  autoreplyBodyText: string[];
  /** Plain-text intro for the notification email. */
  notifyIntroText: string;
  /** Preheader text shown in the inbox preview. */
  preheaderNew: string;
  preheaderReceived: string;
}

export interface Defaults {
  orgName: string;
  notifySubject: string;
  autoresponderSubject: string;
  /** Fallback word used where a category is expected but missing. */
  categoryFallback: string;
  fields: FieldDef[];
}

export interface Locale {
  admin: AdminMessages;
  email: EmailMessages;
  defaults: Defaults;
}

// --- English (default) -------------------------------------------------------
const en: Locale = {
  admin: {
    languageOptionLabel: "English",
    languageFieldLabel: "Language",

    settingsTitle: "Contact Form Settings",
    settingsIntro:
      "Blocks spam with Cloudflare Turnstile and sends branded HTML email via Cloudflare Email Sending (the send_email binding). The sending domain must already be onboarded to Email Sending.",
    saveButton: "Save",

    orgNameLabel: "Organization name",
    orgNamePlaceholder: "Shown in the email header and footer",
    logoUrlLabel: "Logo image URL",
    logoUrlPlaceholder: "https://example.com/icon.png — PNG, absolute URL",
    brandColorLabel: "Brand color",
    brandColorPlaceholder: "#1675b9",
    fontFamilyLabel: "Email font",
    fontFamilyPlaceholder:
      "CSS font-family list, e.g. 'Hiragino Mincho ProN','Yu Mincho',serif — email clients only use device fonts (web fonts are ignored). Blank = default sans stack",
    footerLabel: "Footer",
    footerPlaceholder: "Address, tel, etc. — line breaks allowed",
    siteUrlLabel: "Site URL",
    siteUrlPlaceholder: "Shown as a link in the footer",
    fromAddressLabel: "From address",
    fromAddressPlaceholder: "Acme Inc. <noreply@example.com>",
    toEmailsLabel: "Notification recipients",
    toEmailsPlaceholder: "Comma or newline separated; multiple allowed",
    bindingNameLabel: "send_email binding name",
    turnstileSiteKeyLabel: "Turnstile site key",
    turnstileSiteKeyPlaceholder: "Public key",
    turnstileSecretLabel: "Turnstile secret key",
    turnstileSecretPlaceholder: "Leave blank to keep the current value",
    notifySubjectLabel: "Notification subject",
    notifySubjectPlaceholder: "Supports {type} and {name} placeholders",
    autoresponderLabel: "Send an auto-reply to the submitter",
    autoresponderSubjectLabel: "Auto-reply subject",
    templateLabel: "Email template",
    templateBrandedOption: "Branded",
    templateEditorialOption: "Editorial (whitespace, hairline rules)",
    templateElegantOption: "Elegant (serif & hairline rules)",
    confirmMessageLabel: "Confirmation message",
    confirmMessagePlaceholder: "Optional — shown after a successful submission",
    fieldsLabel: "Field definitions",
    fieldsPlaceholder: "JSON array — leave blank for the defaults",

    toastSaved: "Settings saved.",
    toastSaveFailed: "Failed to save.",
    toastInvalidFrom: "From must be in the form name@domain or Name <name@domain>.",
    toastInvalidFields: "Field definitions are not valid JSON.",
    toastInvalidFont: 'Email font must be a CSS font-family list (the characters <>"{};\\ are not allowed).',

    turnstileStatusSet: "Turnstile secret key: configured.",
    turnstileStatusMissing:
      "Turnstile secret key: not configured — submissions are rejected until it is set.",

    submissionsTitle: "Form Submissions",
    colReceivedAt: "Received at",
    colCategory: "Category",
    colName: "Name",
    colEmail: "Email",
  },
  email: {
    htmlLang: "en",
    autoFooterNote: "This email was sent automatically from the contact form.",
    notifyHeading: "New inquiry",
    autoreplyHeading: "Thank you for your inquiry",
    inquiryContentLabel: "Message",
    greeting: (name) => `Dear ${name},`,
    notifySubLabel: (category, name) => (name ? `${category} / ${name}` : category),
    autoreplyBodyHtml:
      "Thank you for contacting us. We have received your inquiry with the details below. A member of our team will get back to you <strong>within 2 business days</strong>.",
    autoreplyBodyText: [
      "Thank you for contacting us.",
      "We have received your inquiry with the details below. A member of our team will get back to you within 2 business days.",
      "",
    ],
    notifyIntroText: "A new inquiry has been received.",
    preheaderNew: "New inquiry",
    preheaderReceived: "We have received your inquiry",
  },
  defaults: {
    orgName: "Contact",
    notifySubject: "[Inquiry] {type} / {name}",
    autoresponderSubject: "We have received your inquiry",
    categoryFallback: "Inquiry",
    fields: [
      {
        name: "type",
        label: "Inquiry type",
        type: "select",
        options: ["Construction request / Quote", "Careers", "Partnership inquiry", "Press / Media", "Other"],
      },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "kana", label: "Name (phonetic)", type: "text" },
      { name: "company", label: "Company / Organization", type: "text" },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "tel", label: "Phone", type: "tel" },
      { name: "message", label: "Message", type: "textarea", required: true },
    ],
  },
};

// --- Japanese ----------------------------------------------------------------
const ja: Locale = {
  admin: {
    languageOptionLabel: "日本語",
    languageFieldLabel: "言語",

    settingsTitle: "お問い合わせフォーム設定",
    settingsIntro:
      "Cloudflare Turnstile でスパムを防ぎ、Cloudflare Email Sending（send_email バインディング）でブランドHTMLメールを通知します。送信ドメインは Email Sending に onboard 済みである必要があります。",
    saveButton: "保存",

    orgNameLabel: "組織名",
    orgNamePlaceholder: "メールのヘッダ・フッタに表示されます",
    logoUrlLabel: "ロゴ画像URL",
    logoUrlPlaceholder: "https://example.com/icon.png ・PNG推奨・絶対URL",
    brandColorLabel: "ブランドカラー",
    brandColorPlaceholder: "#1675b9",
    fontFamilyLabel: "メールフォント",
    fontFamilyPlaceholder:
      "CSSのfont-family形式。例: 'Hiragino Mincho ProN','Yu Mincho',serif ・メールでは端末フォントのみ有効（Webフォント不可）。空欄で既定のゴシック",
    footerLabel: "フッタ",
    footerPlaceholder: "住所・TEL など。改行できます",
    siteUrlLabel: "サイトURL",
    siteUrlPlaceholder: "フッタにリンクとして表示されます",
    fromAddressLabel: "差出人 From",
    fromAddressPlaceholder: "有限会社○○ <noreply@example.com>",
    toEmailsLabel: "通知先メール",
    toEmailsPlaceholder: "カンマまたは改行区切りで複数指定できます",
    bindingNameLabel: "send_email バインディング名",
    turnstileSiteKeyLabel: "Turnstile サイトキー",
    turnstileSiteKeyPlaceholder: "公開キー",
    turnstileSecretLabel: "Turnstile シークレットキー",
    turnstileSecretPlaceholder: "空欄のままにすると現在の値を維持します",
    notifySubjectLabel: "通知メール件名",
    notifySubjectPlaceholder: "{type} {name} を差し込めます",
    autoresponderLabel: "送信者へ自動返信を送る",
    autoresponderSubjectLabel: "自動返信の件名",
    templateLabel: "メールテンプレート",
    templateBrandedOption: "Branded",
    templateEditorialOption: "Editorial（余白・ヘアライン基調）",
    templateElegantOption: "Elegant（明朝・罫線基調）",
    confirmMessageLabel: "送信完了メッセージ",
    confirmMessagePlaceholder: "任意。送信成功後に表示されます",
    fieldsLabel: "フィールド定義",
    fieldsPlaceholder: "JSON配列。空欄で既定値を使用します",

    toastSaved: "設定を保存しました",
    toastSaveFailed: "保存に失敗しました",
    toastInvalidFrom: "From は name@domain か Name <name@domain> 形式で入力してください",
    toastInvalidFields: "フィールド定義が不正なJSONです",
    toastInvalidFont: 'メールフォントは CSS の font-family 形式で入力してください（<>"{};\\ は使用できません）',

    turnstileStatusSet: "Turnstile シークレットキー: 設定済み",
    turnstileStatusMissing: "Turnstile シークレットキー: 未設定 — 設定するまでフォーム送信は受け付けられません",

    submissionsTitle: "お問い合わせ送信履歴",
    colReceivedAt: "受信日時",
    colCategory: "種別",
    colName: "お名前",
    colEmail: "メール",
  },
  email: {
    htmlLang: "ja",
    autoFooterNote: "このメールはお問い合わせフォームから自動送信されています。",
    notifyHeading: "新しいお問い合わせ",
    autoreplyHeading: "お問い合わせありがとうございます",
    inquiryContentLabel: "お問い合わせ内容",
    greeting: (name) => `${name} 様`,
    notifySubLabel: (category, name) => (name ? `${category} ／ ${name} 様` : category),
    autoreplyBodyHtml:
      "このたびはお問い合わせいただき、誠にありがとうございます。以下の内容で受け付けいたしました。担当者より<strong>2営業日以内</strong>にご返信いたします。",
    autoreplyBodyText: [
      "このたびはお問い合わせいただき、誠にありがとうございます。",
      "以下の内容で受け付けいたしました。担当者より2営業日以内にご返信いたします。",
      "",
    ],
    notifyIntroText: "新しいお問い合わせがありました。",
    preheaderNew: "新しいお問い合わせ",
    preheaderReceived: "お問い合わせを受け付けました",
  },
  defaults: {
    orgName: "お問い合わせ",
    notifySubject: "【お問い合わせ】{type} / {name} 様",
    autoresponderSubject: "お問い合わせを受け付けました",
    categoryFallback: "お問い合わせ",
    fields: [
      {
        name: "type",
        label: "お問い合わせ種別",
        type: "select",
        options: ["施工のご依頼・お見積り", "採用について", "協力会社のご相談", "取材・メディア", "その他"],
      },
      { name: "name", label: "お名前", type: "text", required: true },
      { name: "kana", label: "フリガナ", type: "text" },
      { name: "company", label: "会社名・所属", type: "text" },
      { name: "email", label: "メールアドレス", type: "email", required: true },
      { name: "tel", label: "電話番号", type: "tel" },
      { name: "message", label: "お問い合わせ内容", type: "textarea", required: true },
    ],
  },
};

const LOCALES: Record<Lang, Locale> = { en, ja };

export function getLocale(lang: Lang): Locale {
  return LOCALES[lang];
}

/** Returns a fresh copy of the default field set for the given language. */
export function defaultFields(lang: Lang): FieldDef[] {
  return LOCALES[lang].defaults.fields.map((f) => ({ ...f, options: f.options ? [...f.options] : undefined }));
}
