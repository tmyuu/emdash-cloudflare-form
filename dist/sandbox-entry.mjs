import { env } from "cloudflare:workers";
//#region src/i18n.ts
/** Supported languages, in the order shown in the settings dropdown. */
const LANGS = ["en", "ja"];
function isLang(v) {
	return v === "en" || v === "ja";
}
function normalizeLang(v) {
	return isLang(v) ? v : "en";
}
const LOCALES = {
	en: {
		admin: {
			languageOptionLabel: "English",
			languageFieldLabel: "Language",
			settingsTitle: "Contact Form Settings",
			settingsIntro: "Blocks spam with Cloudflare Turnstile and sends branded HTML email via Cloudflare Email Sending (the send_email binding). The sending domain must already be onboarded to Email Sending.",
			saveButton: "Save",
			orgNameLabel: "Organization name",
			orgNamePlaceholder: "Shown in the email header and footer",
			logoUrlLabel: "Logo image URL",
			logoUrlPlaceholder: "https://example.com/icon.png — PNG, absolute URL",
			brandColorLabel: "Brand color",
			brandColorPlaceholder: "#1675b9",
			fontFamilyLabel: "Email font",
			fontFamilyPlaceholder: "CSS font-family list, e.g. 'Hiragino Mincho ProN','Yu Mincho',serif — email clients only use device fonts (web fonts are ignored). Blank = default sans stack",
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
			confirmMessageLabel: "Confirmation message",
			confirmMessagePlaceholder: "Optional — shown after a successful submission",
			fieldsLabel: "Field definitions",
			fieldsPlaceholder: "JSON array — leave blank for the defaults",
			toastSaved: "Settings saved.",
			toastSaveFailed: "Failed to save.",
			toastInvalidFrom: "From must be in the form name@domain or Name <name@domain>.",
			toastInvalidFields: "Field definitions are not valid JSON.",
			toastInvalidFont: "Email font must be a CSS font-family list (the characters <>\"{};\\ are not allowed).",
			turnstileStatusSet: "Turnstile secret key: configured.",
			turnstileStatusMissing: "Turnstile secret key: not configured — submissions are rejected until it is set.",
			submissionsTitle: "Form Submissions",
			colReceivedAt: "Received at",
			colCategory: "Category",
			colName: "Name",
			colEmail: "Email"
		},
		email: {
			htmlLang: "en",
			autoFooterNote: "This email was sent automatically from the contact form.",
			notifyHeading: "New inquiry",
			autoreplyHeading: "Thank you for your inquiry",
			inquiryContentLabel: "Message",
			greeting: (name) => `Dear ${name},`,
			notifySubLabel: (category, name) => name ? `${category} / ${name}` : category,
			autoreplyBodyHtml: "Thank you for contacting us. We have received your inquiry with the details below. A member of our team will get back to you <strong>within 2 business days</strong>.",
			autoreplyBodyText: [
				"Thank you for contacting us.",
				"We have received your inquiry with the details below. A member of our team will get back to you within 2 business days.",
				""
			],
			notifyIntroText: "A new inquiry has been received.",
			preheaderNew: "New inquiry",
			preheaderReceived: "We have received your inquiry"
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
					options: [
						"Construction request / Quote",
						"Careers",
						"Partnership inquiry",
						"Press / Media",
						"Other"
					]
				},
				{
					name: "name",
					label: "Name",
					type: "text",
					required: true
				},
				{
					name: "kana",
					label: "Name (phonetic)",
					type: "text"
				},
				{
					name: "company",
					label: "Company / Organization",
					type: "text"
				},
				{
					name: "email",
					label: "Email",
					type: "email",
					required: true
				},
				{
					name: "tel",
					label: "Phone",
					type: "tel"
				},
				{
					name: "message",
					label: "Message",
					type: "textarea",
					required: true
				}
			]
		}
	},
	ja: {
		admin: {
			languageOptionLabel: "日本語",
			languageFieldLabel: "言語",
			settingsTitle: "お問い合わせフォーム設定",
			settingsIntro: "Cloudflare Turnstile でスパムを防ぎ、Cloudflare Email Sending（send_email バインディング）でブランドHTMLメールを通知します。送信ドメインは Email Sending に onboard 済みである必要があります。",
			saveButton: "保存",
			orgNameLabel: "組織名",
			orgNamePlaceholder: "メールのヘッダ・フッタに表示されます",
			logoUrlLabel: "ロゴ画像URL",
			logoUrlPlaceholder: "https://example.com/icon.png ・PNG推奨・絶対URL",
			brandColorLabel: "ブランドカラー",
			brandColorPlaceholder: "#1675b9",
			fontFamilyLabel: "メールフォント",
			fontFamilyPlaceholder: "CSSのfont-family形式。例: 'Hiragino Mincho ProN','Yu Mincho',serif ・メールでは端末フォントのみ有効（Webフォント不可）。空欄で既定のゴシック",
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
			confirmMessageLabel: "送信完了メッセージ",
			confirmMessagePlaceholder: "任意。送信成功後に表示されます",
			fieldsLabel: "フィールド定義",
			fieldsPlaceholder: "JSON配列。空欄で既定値を使用します",
			toastSaved: "設定を保存しました",
			toastSaveFailed: "保存に失敗しました",
			toastInvalidFrom: "From は name@domain か Name <name@domain> 形式で入力してください",
			toastInvalidFields: "フィールド定義が不正なJSONです",
			toastInvalidFont: "メールフォントは CSS の font-family 形式で入力してください（<>\"{};\\ は使用できません）",
			turnstileStatusSet: "Turnstile シークレットキー: 設定済み",
			turnstileStatusMissing: "Turnstile シークレットキー: 未設定 — 設定するまでフォーム送信は受け付けられません",
			submissionsTitle: "お問い合わせ送信履歴",
			colReceivedAt: "受信日時",
			colCategory: "種別",
			colName: "お名前",
			colEmail: "メール"
		},
		email: {
			htmlLang: "ja",
			autoFooterNote: "このメールはお問い合わせフォームから自動送信されています。",
			notifyHeading: "新しいお問い合わせ",
			autoreplyHeading: "お問い合わせありがとうございます",
			inquiryContentLabel: "お問い合わせ内容",
			greeting: (name) => `${name} 様`,
			notifySubLabel: (category, name) => name ? `${category} ／ ${name} 様` : category,
			autoreplyBodyHtml: "このたびはお問い合わせいただき、誠にありがとうございます。以下の内容で受け付けいたしました。担当者より<strong>2営業日以内</strong>にご返信いたします。",
			autoreplyBodyText: [
				"このたびはお問い合わせいただき、誠にありがとうございます。",
				"以下の内容で受け付けいたしました。担当者より2営業日以内にご返信いたします。",
				""
			],
			notifyIntroText: "新しいお問い合わせがありました。",
			preheaderNew: "新しいお問い合わせ",
			preheaderReceived: "お問い合わせを受け付けました"
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
					options: [
						"施工のご依頼・お見積り",
						"採用について",
						"協力会社のご相談",
						"取材・メディア",
						"その他"
					]
				},
				{
					name: "name",
					label: "お名前",
					type: "text",
					required: true
				},
				{
					name: "kana",
					label: "フリガナ",
					type: "text"
				},
				{
					name: "company",
					label: "会社名・所属",
					type: "text"
				},
				{
					name: "email",
					label: "メールアドレス",
					type: "email",
					required: true
				},
				{
					name: "tel",
					label: "電話番号",
					type: "tel"
				},
				{
					name: "message",
					label: "お問い合わせ内容",
					type: "textarea",
					required: true
				}
			]
		}
	}
};
function getLocale(lang) {
	return LOCALES[lang];
}
/** Returns a fresh copy of the default field set for the given language. */
function defaultFields(lang) {
	return LOCALES[lang].defaults.fields.map((f) => ({
		...f,
		options: f.options ? [...f.options] : void 0
	}));
}
/**
* The font stack actually embedded into inline styles. The setting is
* validated on save, but strip style-breaking characters here too so a
* value written to KV by other means cannot escape the attribute.
*/
function fontOf(brand) {
	return brand.fontFamily?.replace(/[<>"{};\\]/g, "").trim() || "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,'Segoe UI',sans-serif";
}
function escapeHtml(s) {
	return s.replace(/[&<>"']/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[c]);
}
function shell(lang, brand, preheader, inner) {
	const loc = getLocale(lang);
	const accent = brand.brandColor || "#1675b9";
	const font = fontOf(brand);
	const logo = brand.logoUrl ? `<img src="${escapeHtml(brand.logoUrl)}" width="34" height="34" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:6px;background:#ffffff;" />` : "";
	const footerLines = (brand.footer || "").split("\n").map((l) => escapeHtml(l)).join("<br>");
	const siteLink = brand.siteUrl ? `<br><a href="${escapeHtml(brand.siteUrl)}" style="color:${accent};text-decoration:none;">${escapeHtml(brand.siteUrl.replace(/^https?:\/\//, ""))}</a>` : "";
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
function rowsHtml(brand, pairs) {
	const accent = brand.brandColor || "#1675b9";
	const font = fontOf(brand);
	return pairs.filter((p) => p.value).map((p) => `<tr>
<td style="padding:10px 14px;background:#eef6fd;color:${accent};font-family:${font};font-size:12px;font-weight:bold;white-space:nowrap;vertical-align:top;border-bottom:1px solid #e2e8f0;">${escapeHtml(p.label)}</td>
<td style="padding:10px 14px;color:#1e293b;font-family:${font};font-size:14px;line-height:1.7;border-bottom:1px solid #e2e8f0;word-break:break-all;">${escapeHtml(p.value)}</td>
</tr>`).join("");
}
function messageBox(font, message) {
	return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:16px;font-family:${font};font-size:14px;line-height:1.9;color:#1e293b;white-space:pre-wrap;">${escapeHtml(message)}</div>`;
}
/** The default branded design. */
const branded = (input) => {
	const loc = getLocale(input.lang);
	const accent = input.brand.brandColor || "#1675b9";
	const font = fontOf(input.brand);
	const sub = input.category ? escapeHtml(loc.email.notifySubLabel(input.category, input.submitterName ?? "")) : "";
	let inner;
	if (input.kind === "notify") inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 4px;font-family:${font};font-size:18px;color:#0f172a;">${escapeHtml(loc.email.notifyHeading)}</h1>
${sub ? `<p style="margin:0 0 20px;font-family:${font};font-size:13px;color:#64748b;">${sub}</p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-collapse:collapse;">${rowsHtml(input.brand, input.pairs)}</table>
${input.message ? `<p style="margin:22px 0 6px;font-family:${font};font-size:13px;font-weight:bold;color:${accent};">${escapeHtml(loc.email.inquiryContentLabel)}</p>${messageBox(font, input.message)}` : ""}
</td></tr>`;
	else inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-family:${font};font-size:18px;color:#0f172a;">${escapeHtml(loc.email.autoreplyHeading)}</h1>
${input.submitterName ? `<p style="margin:0 0 14px;font-family:${font};font-size:14px;line-height:1.9;color:#1e293b;">${escapeHtml(loc.email.greeting(input.submitterName))}</p>` : ""}
<p style="margin:0 0 18px;font-family:${font};font-size:14px;line-height:1.9;color:#1e293b;">${loc.email.autoreplyBodyHtml}</p>
${input.message ? `<p style="margin:0 0 6px;font-family:${font};font-size:13px;font-weight:bold;color:${accent};">${escapeHtml(loc.email.inquiryContentLabel)}</p>${messageBox(font, input.message)}` : ""}
</td></tr>`;
	const pre = input.kind === "notify" ? `${input.category ?? ""} ${input.submitterName ?? ""}`.trim() || loc.email.preheaderNew : loc.email.preheaderReceived;
	const html = shell(input.lang, input.brand, pre, inner);
	const textLines = [];
	if (input.kind === "autoreply") {
		if (input.submitterName) textLines.push(loc.email.greeting(input.submitterName), "");
		textLines.push(...loc.email.autoreplyBodyText);
	} else textLines.push(loc.email.notifyIntroText, "");
	for (const p of input.pairs) if (p.value) textLines.push(`■ ${p.label}: ${p.value}`);
	if (input.message) textLines.push("", `■ ${loc.email.inquiryContentLabel}:`, input.message);
	textLines.push("", "--", input.brand.orgName);
	return {
		html,
		text: textLines.join("\n")
	};
};
const TEMPLATES = { branded };
function renderEmail(templateId, input) {
	return (templateId && TEMPLATES[templateId] || branded)(input);
}
//#endregion
//#region src/sandbox-entry.ts
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_BINDING = "EMAIL";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
	fields: "settings:fields"
};
function parseFields(raw, lang) {
	if (!raw.trim()) return defaultFields(lang);
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length === 0) return defaultFields(lang);
		return parsed.every((f) => f && typeof f.name === "string" && typeof f.label === "string" && typeof f.type === "string") ? parsed : defaultFields(lang);
	} catch {
		return defaultFields(lang);
	}
}
function clip(v, max) {
	return (v ?? "").toString().trim().slice(0, max);
}
function splitList(s) {
	return s.split(/[\n,]/).map((x) => x.trim()).filter((x) => EMAIL_RE.test(x));
}
function parseFrom(input) {
	const m = input.match(/^\s*(?:(.+?)\s*<\s*([^>]+?)\s*>|([^\s<>]+))\s*$/);
	if (!m) return null;
	const email = (m[2] ?? m[3] ?? "").trim();
	if (!EMAIL_RE.test(email)) return null;
	const name = m[1]?.trim().replace(/^"|"$/g, "");
	return name ? {
		email,
		name
	} : { email };
}
/** parseFrom の結果を binding が受け付ける形（文字列 or name 必須オブジェクト）に変換する */
function toSendAddress(parsed, fallbackName) {
	const name = parsed.name ?? fallbackName?.trim();
	return name ? {
		email: parsed.email,
		name
	} : parsed.email;
}
function getBinding(name) {
	const binding = env[name];
	if (!binding || typeof binding.send !== "function") throw new Error(`Cloudflare Email Sending binding "${name}" not found on env. Add { "send_email": [{ "name": "${name}" }] } to wrangler config and run the plugin in-process (plugins:, not sandboxed:).`);
	return binding;
}
async function getStr(ctx, key, def = "") {
	const v = await ctx.kv.get(key);
	return typeof v === "string" && v.length > 0 ? v : def;
}
async function loadConfig(ctx) {
	const lang = normalizeLang(await getStr(ctx, K.language, "en"));
	const loc = getLocale(lang);
	return {
		lang,
		brand: {
			orgName: await getStr(ctx, K.orgName, loc.defaults.orgName),
			logoUrl: await getStr(ctx, K.logoUrl),
			brandColor: await getStr(ctx, K.brandColor, "#1675b9"),
			fontFamily: await getStr(ctx, K.fontFamily),
			footer: await getStr(ctx, K.footer),
			siteUrl: await getStr(ctx, K.siteUrl)
		},
		from: await getStr(ctx, K.fromAddress),
		bindingName: await getStr(ctx, K.bindingName, DEFAULT_BINDING) || DEFAULT_BINDING,
		toEmails: splitList(await getStr(ctx, K.toEmails)),
		turnstileSecret: await getStr(ctx, K.turnstileSecret),
		turnstileSiteKey: await getStr(ctx, K.turnstileSiteKey),
		autoresponder: await getStr(ctx, K.autoresponder) === "1",
		notifySubject: await getStr(ctx, K.notifySubject, loc.defaults.notifySubject),
		autoresponderSubject: await getStr(ctx, K.autoresponderSubject, loc.defaults.autoresponderSubject),
		template: await getStr(ctx, K.template, "branded"),
		confirmMessage: await getStr(ctx, K.confirmMessage),
		fields: parseFields(await getStr(ctx, K.fields), lang)
	};
}
async function verifyTurnstile(secret, token, ip) {
	const body = new URLSearchParams();
	body.set("secret", secret);
	body.set("response", token);
	if (ip) body.set("remoteip", ip);
	try {
		const res = await fetch(TURNSTILE_VERIFY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: body.toString()
		});
		if (!res.ok) return false;
		return (await res.json()).success === true;
	} catch {
		return false;
	}
}
function getHeader(req, name) {
	const h = req.headers;
	if (typeof h.get === "function") return h.get(name) ?? void 0;
	return h[name] ?? h[name.toLowerCase()] ?? void 0;
}
async function handleSubmit(routeCtx, ctx) {
	const cfg = await loadConfig(ctx);
	const loc = getLocale(cfg.lang);
	const parsedFrom = parseFrom(cfg.from);
	if (!cfg.turnstileSecret || !parsedFrom || cfg.toEmails.length === 0) return {
		ok: false,
		error: "not_configured"
	};
	const from = toSendAddress(parsedFrom, cfg.brand.orgName);
	const body = routeCtx.input ?? {};
	const token = clip(body.token ?? body["cf-turnstile-response"], 4e3);
	if (!token) return {
		ok: false,
		error: "turnstile_missing"
	};
	const values = {};
	for (const f of cfg.fields) {
		const v = clip(body[f.name], f.type === "textarea" ? 5e3 : 500);
		values[f.name] = v;
		if (f.required && !v) return {
			ok: false,
			error: "required_fields",
			field: f.name
		};
		if (f.type === "email" && v && !EMAIL_RE.test(v)) return {
			ok: false,
			error: "invalid_email",
			field: f.name
		};
	}
	const ip = getHeader(routeCtx.request, "cf-connecting-ip");
	if (!await verifyTurnstile(cfg.turnstileSecret, token, ip)) return {
		ok: false,
		error: "turnstile_failed"
	};
	const emailField = cfg.fields.find((f) => f.type === "email");
	const textareaField = cfg.fields.find((f) => f.type === "textarea");
	const selectField = cfg.fields.find((f) => f.type === "select") ?? cfg.fields.find((f) => f.name === "type");
	const nameField = cfg.fields.find((f) => f.name === "name") ?? cfg.fields.find((f) => f.type === "text");
	const submitterEmail = emailField ? values[emailField.name] : "";
	const submitterName = nameField ? values[nameField.name] : "";
	const category = selectField ? values[selectField.name] : "";
	const message = textareaField ? values[textareaField.name] : "";
	const pairs = cfg.fields.filter((f) => f.type !== "textarea").map((f) => ({
		label: f.label,
		value: values[f.name] ?? ""
	}));
	try {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		await ctx.storage.submissions.put(id, {
			values,
			category,
			submitterEmail,
			submitterName,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		});
	} catch (err) {
		ctx.log.error("Failed to store submission", err);
	}
	const subjectTokens = (s) => s.replace(/\{type\}/g, category || loc.defaults.categoryFallback).replace(/\{name\}/g, submitterName || "");
	const binding = getBinding(cfg.bindingName);
	try {
		const mail = renderEmail(cfg.template, {
			kind: "notify",
			lang: cfg.lang,
			brand: cfg.brand,
			pairs,
			message,
			submitterName,
			category
		});
		await binding.send({
			to: cfg.toEmails,
			from,
			replyTo: submitterEmail || void 0,
			subject: subjectTokens(cfg.notifySubject),
			html: mail.html,
			text: mail.text
		});
	} catch (err) {
		ctx.log.error("Failed to send notification email", err);
		return {
			ok: false,
			error: "send_failed"
		};
	}
	if (cfg.autoresponder && submitterEmail) try {
		const mail = renderEmail(cfg.template, {
			kind: "autoreply",
			lang: cfg.lang,
			brand: cfg.brand,
			pairs,
			message,
			submitterName,
			category
		});
		await binding.send({
			to: submitterEmail,
			from,
			replyTo: cfg.toEmails[0],
			subject: cfg.autoresponderSubject,
			html: mail.html,
			text: mail.text
		});
	} catch (err) {
		ctx.log.error("Failed to send auto-reply", err);
	}
	return {
		ok: true,
		message: cfg.confirmMessage || void 0
	};
}
async function handleConfig(_routeCtx, ctx) {
	const cfg = await loadConfig(ctx);
	return {
		language: cfg.lang,
		turnstileSiteKey: cfg.turnstileSiteKey,
		confirmMessage: cfg.confirmMessage,
		fields: cfg.fields
	};
}
async function buildSettingsPage(ctx) {
	const cfg = await loadConfig(ctx);
	const t = getLocale(cfg.lang).admin;
	return { blocks: [
		{
			type: "header",
			text: t.settingsTitle
		},
		{
			type: "section",
			text: t.settingsIntro
		},
		{
			type: "section",
			text: cfg.turnstileSecret ? t.turnstileStatusSet : t.turnstileStatusMissing
		},
		{
			type: "form",
			submit: {
				label: t.saveButton,
				action_id: "save_settings"
			},
			fields: [
				{
					type: "select",
					action_id: "language",
					label: t.languageFieldLabel,
					initial_value: cfg.lang,
					options: LANGS.map((l) => ({
						value: l,
						label: getLocale(l).admin.languageOptionLabel
					}))
				},
				{
					type: "text_input",
					action_id: "orgName",
					label: t.orgNameLabel,
					placeholder: t.orgNamePlaceholder,
					initial_value: cfg.brand.orgName
				},
				{
					type: "text_input",
					action_id: "logoUrl",
					label: t.logoUrlLabel,
					placeholder: t.logoUrlPlaceholder,
					initial_value: cfg.brand.logoUrl ?? ""
				},
				{
					type: "text_input",
					action_id: "brandColor",
					label: t.brandColorLabel,
					placeholder: t.brandColorPlaceholder,
					initial_value: cfg.brand.brandColor
				},
				{
					type: "text_input",
					action_id: "fontFamily",
					label: t.fontFamilyLabel,
					placeholder: t.fontFamilyPlaceholder,
					initial_value: cfg.brand.fontFamily ?? ""
				},
				{
					type: "text_input",
					action_id: "footer",
					label: t.footerLabel,
					placeholder: t.footerPlaceholder,
					multiline: true,
					initial_value: cfg.brand.footer ?? ""
				},
				{
					type: "text_input",
					action_id: "siteUrl",
					label: t.siteUrlLabel,
					placeholder: t.siteUrlPlaceholder,
					initial_value: cfg.brand.siteUrl ?? ""
				},
				{
					type: "text_input",
					action_id: "fromAddress",
					label: t.fromAddressLabel,
					placeholder: t.fromAddressPlaceholder,
					initial_value: cfg.from,
					required: true
				},
				{
					type: "text_input",
					action_id: "toEmails",
					label: t.toEmailsLabel,
					placeholder: t.toEmailsPlaceholder,
					multiline: true,
					initial_value: cfg.toEmails.join("\n"),
					required: true
				},
				{
					type: "text_input",
					action_id: "bindingName",
					label: t.bindingNameLabel,
					placeholder: DEFAULT_BINDING,
					initial_value: cfg.bindingName === DEFAULT_BINDING ? "" : cfg.bindingName
				},
				{
					type: "text_input",
					action_id: "turnstileSiteKey",
					label: t.turnstileSiteKeyLabel,
					placeholder: t.turnstileSiteKeyPlaceholder,
					initial_value: cfg.turnstileSiteKey
				},
				{
					type: "secret_input",
					action_id: "turnstileSecret",
					label: t.turnstileSecretLabel,
					placeholder: t.turnstileSecretPlaceholder
				},
				{
					type: "text_input",
					action_id: "notifySubject",
					label: t.notifySubjectLabel,
					placeholder: t.notifySubjectPlaceholder,
					initial_value: cfg.notifySubject
				},
				{
					type: "toggle",
					action_id: "autoresponder",
					label: t.autoresponderLabel,
					initial_value: cfg.autoresponder
				},
				{
					type: "text_input",
					action_id: "autoresponderSubject",
					label: t.autoresponderSubjectLabel,
					initial_value: cfg.autoresponderSubject
				},
				{
					type: "select",
					action_id: "template",
					label: t.templateLabel,
					initial_value: cfg.template,
					options: [{
						value: "branded",
						label: t.templateBrandedOption
					}]
				},
				{
					type: "text_input",
					action_id: "confirmMessage",
					label: t.confirmMessageLabel,
					placeholder: t.confirmMessagePlaceholder,
					multiline: true,
					initial_value: cfg.confirmMessage
				},
				{
					type: "text_input",
					action_id: "fields",
					label: t.fieldsLabel,
					placeholder: t.fieldsPlaceholder,
					multiline: true,
					initial_value: JSON.stringify(cfg.fields, null, 2)
				}
			]
		}
	] };
}
async function saveSettings(ctx, values) {
	if (typeof values.language === "string") await ctx.kv.set(K.language, normalizeLang(values.language));
	const t = getLocale(normalizeLang(await getStr(ctx, K.language, "en"))).admin;
	try {
		const setStr = async (key, v) => {
			const s = typeof v === "string" ? v.trim() : "";
			if (s) await ctx.kv.set(key, s);
			else await ctx.kv.delete(key);
		};
		if (typeof values.fromAddress === "string" && !parseFrom(values.fromAddress)) return {
			...await buildSettingsPage(ctx),
			toast: {
				message: t.toastInvalidFrom,
				type: "error"
			}
		};
		if (typeof values.fontFamily === "string" && /[<>"{};\\]/.test(values.fontFamily)) return {
			...await buildSettingsPage(ctx),
			toast: {
				message: t.toastInvalidFont,
				type: "error"
			}
		};
		if (typeof values.fields === "string" && values.fields.trim()) try {
			const p = JSON.parse(values.fields);
			if (!Array.isArray(p)) throw new Error("not array");
		} catch {
			return {
				...await buildSettingsPage(ctx),
				toast: {
					message: t.toastInvalidFields,
					type: "error"
				}
			};
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
		if (values.autoresponder === true) await ctx.kv.set(K.autoresponder, "1");
		else await ctx.kv.delete(K.autoresponder);
		if (typeof values.turnstileSecret === "string" && values.turnstileSecret.trim()) await ctx.kv.set(K.turnstileSecret, values.turnstileSecret.trim());
		return {
			...await buildSettingsPage(ctx),
			toast: {
				message: t.toastSaved,
				type: "success"
			}
		};
	} catch (err) {
		ctx.log.error("Failed to save contact form settings", err);
		return {
			...await buildSettingsPage(ctx),
			toast: {
				message: t.toastSaveFailed,
				type: "error"
			}
		};
	}
}
async function buildSubmissionsPage(ctx) {
	const t = getLocale((await loadConfig(ctx)).lang).admin;
	let rows = [];
	try {
		rows = ((await ctx.storage.submissions.query({
			orderBy: { createdAt: "desc" },
			limit: 100
		})).items ?? []).map((item) => {
			const d = item.data ?? {};
			return {
				createdAt: d.createdAt ?? "",
				category: d.category ?? "",
				name: d.submitterName ?? "",
				email: d.submitterEmail ?? ""
			};
		});
	} catch (err) {
		ctx.log.error("Failed to load submissions", err);
	}
	return { blocks: [{
		type: "header",
		text: t.submissionsTitle
	}, {
		type: "table",
		blockId: "submissions-table",
		columns: [
			{
				key: "createdAt",
				label: t.colReceivedAt,
				format: "datetime"
			},
			{
				key: "category",
				label: t.colCategory,
				format: "text"
			},
			{
				key: "name",
				label: t.colName,
				format: "text"
			},
			{
				key: "email",
				label: t.colEmail,
				format: "text"
			}
		],
		rows
	}] };
}
async function handleAdmin(routeCtx, ctx) {
	const it = routeCtx.input;
	if (it.type === "page_load" && it.page === "/submissions") return buildSubmissionsPage(ctx);
	if (it.type === "page_load") return buildSettingsPage(ctx);
	if (it.type === "form_submit" && it.action_id === "save_settings") return saveSettings(ctx, it.values ?? {});
	return { blocks: [] };
}
var sandbox_entry_default = { routes: {
	submit: {
		public: true,
		handler: handleSubmit
	},
	config: {
		public: true,
		handler: handleConfig
	},
	admin: { handler: handleAdmin }
} };
//#endregion
export { sandbox_entry_default as default };
