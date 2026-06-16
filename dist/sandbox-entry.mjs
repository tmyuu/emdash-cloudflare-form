import { env } from "cloudflare:workers";
//#region src/templates.ts
const SANS = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,'Segoe UI',sans-serif";
function escapeHtml(s) {
	return s.replace(/[&<>"']/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[c]);
}
function shell(brand, preheader, inner) {
	const accent = brand.brandColor || "#1675b9";
	const logo = brand.logoUrl ? `<img src="${escapeHtml(brand.logoUrl)}" width="34" height="34" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:6px;background:#ffffff;" />` : "";
	const footerLines = (brand.footer || "").split("\n").map((l) => escapeHtml(l)).join("<br>");
	const siteLink = brand.siteUrl ? `<br><a href="${escapeHtml(brand.siteUrl)}" style="color:${accent};text-decoration:none;">${escapeHtml(brand.siteUrl.replace(/^https?:\/\//, ""))}</a>` : "";
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
function rowsHtml(brand, pairs) {
	const accent = brand.brandColor || "#1675b9";
	return pairs.filter((p) => p.value).map((p) => `<tr>
<td style="padding:10px 14px;background:#eef6fd;color:${accent};font-family:${SANS};font-size:12px;font-weight:bold;white-space:nowrap;vertical-align:top;border-bottom:1px solid #e2e8f0;">${escapeHtml(p.label)}</td>
<td style="padding:10px 14px;color:#1e293b;font-family:${SANS};font-size:14px;line-height:1.7;border-bottom:1px solid #e2e8f0;word-break:break-all;">${escapeHtml(p.value)}</td>
</tr>`).join("");
}
function messageBox(message) {
	return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:16px;font-family:${SANS};font-size:14px;line-height:1.9;color:#1e293b;white-space:pre-wrap;">${escapeHtml(message)}</div>`;
}
/** The default branded design. */
const branded = (input) => {
	const accent = input.brand.brandColor || "#1675b9";
	const sub = input.category ? `${escapeHtml(input.category)}${input.submitterName ? ` ／ ${escapeHtml(input.submitterName)} 様` : ""}` : "";
	let inner;
	if (input.kind === "notify") inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 4px;font-family:${SANS};font-size:18px;color:#0f172a;">新しいお問い合わせ</h1>
${sub ? `<p style="margin:0 0 20px;font-family:${SANS};font-size:13px;color:#64748b;">${sub}</p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-collapse:collapse;">${rowsHtml(input.brand, input.pairs)}</table>
${input.message ? `<p style="margin:22px 0 6px;font-family:${SANS};font-size:13px;font-weight:bold;color:${accent};">お問い合わせ内容</p>${messageBox(input.message)}` : ""}
</td></tr>`;
	else inner = `<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-family:${SANS};font-size:18px;color:#0f172a;">お問い合わせありがとうございます</h1>
${input.submitterName ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:14px;line-height:1.9;color:#1e293b;">${escapeHtml(input.submitterName)} 様</p>` : ""}
<p style="margin:0 0 18px;font-family:${SANS};font-size:14px;line-height:1.9;color:#1e293b;">このたびはお問い合わせいただき、誠にありがとうございます。以下の内容で受け付けいたしました。担当者より<strong>2営業日以内</strong>にご返信いたします。</p>
${input.message ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:13px;font-weight:bold;color:${accent};">お問い合わせ内容</p>${messageBox(input.message)}` : ""}
</td></tr>`;
	const pre = input.kind === "notify" ? `${input.category ?? ""} ${input.submitterName ?? ""}`.trim() || "新しいお問い合わせ" : "お問い合わせを受け付けました";
	const html = shell(input.brand, pre, inner);
	const textLines = [];
	if (input.kind === "autoreply") {
		if (input.submitterName) textLines.push(`${input.submitterName} 様`, "");
		textLines.push("このたびはお問い合わせいただき、誠にありがとうございます。", "以下の内容で受け付けいたしました。担当者より2営業日以内にご返信いたします。", "");
	} else textLines.push("新しいお問い合わせがありました。", "");
	for (const p of input.pairs) if (p.value) textLines.push(`■ ${p.label}: ${p.value}`);
	if (input.message) textLines.push("", "■ お問い合わせ内容:", input.message);
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
	orgName: "settings:orgName",
	logoUrl: "settings:logoUrl",
	brandColor: "settings:brandColor",
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
const DEFAULT_FIELDS = [
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
];
function parseFields(raw) {
	if (!raw.trim()) return DEFAULT_FIELDS;
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_FIELDS;
		return parsed.every((f) => f && typeof f.name === "string" && typeof f.label === "string" && typeof f.type === "string") ? parsed : DEFAULT_FIELDS;
	} catch {
		return DEFAULT_FIELDS;
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
	return {
		brand: {
			orgName: await getStr(ctx, K.orgName, "お問い合わせ"),
			logoUrl: await getStr(ctx, K.logoUrl),
			brandColor: await getStr(ctx, K.brandColor, "#1675b9"),
			footer: await getStr(ctx, K.footer),
			siteUrl: await getStr(ctx, K.siteUrl)
		},
		from: await getStr(ctx, K.fromAddress),
		bindingName: await getStr(ctx, K.bindingName, DEFAULT_BINDING) || DEFAULT_BINDING,
		toEmails: splitList(await getStr(ctx, K.toEmails)),
		turnstileSecret: await getStr(ctx, K.turnstileSecret),
		turnstileSiteKey: await getStr(ctx, K.turnstileSiteKey),
		autoresponder: await getStr(ctx, K.autoresponder) === "1",
		notifySubject: await getStr(ctx, K.notifySubject, "【お問い合わせ】{type} / {name} 様"),
		autoresponderSubject: await getStr(ctx, K.autoresponderSubject, "お問い合わせを受け付けました"),
		template: await getStr(ctx, K.template, "branded"),
		confirmMessage: await getStr(ctx, K.confirmMessage),
		fields: parseFields(await getStr(ctx, K.fields))
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
	const from = parseFrom(cfg.from);
	if (!cfg.turnstileSecret || !from || cfg.toEmails.length === 0) return {
		ok: false,
		error: "not_configured"
	};
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
	const subjectTokens = (s) => s.replace(/\{type\}/g, category || "お問い合わせ").replace(/\{name\}/g, submitterName || "");
	const binding = getBinding(cfg.bindingName);
	try {
		const mail = renderEmail(cfg.template, {
			kind: "notify",
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
		turnstileSiteKey: cfg.turnstileSiteKey,
		confirmMessage: cfg.confirmMessage,
		fields: cfg.fields
	};
}
async function buildSettingsPage(ctx) {
	const cfg = await loadConfig(ctx);
	return { blocks: [
		{
			type: "header",
			text: "お問い合わせフォーム設定"
		},
		{
			type: "section",
			text: "Cloudflare Turnstile でスパムを防ぎ、Cloudflare Email Sending（send_email バインディング）でブランドHTMLメールを通知します。送信ドメインは Email Sending に onboard 済みである必要があります。"
		},
		{
			type: "form",
			submit: {
				label: "保存",
				action_id: "save_settings"
			},
			fields: [
				{
					type: "text_input",
					action_id: "orgName",
					label: "組織名（ヘッダ・フッタ表示）",
					initial_value: cfg.brand.orgName
				},
				{
					type: "text_input",
					action_id: "logoUrl",
					label: "ロゴ画像URL（PNG推奨・絶対URL）",
					placeholder: "https://example.com/icon.png",
					initial_value: cfg.brand.logoUrl ?? ""
				},
				{
					type: "text_input",
					action_id: "brandColor",
					label: "ブランドカラー（hex）",
					placeholder: "#1675b9",
					initial_value: cfg.brand.brandColor
				},
				{
					type: "text_input",
					action_id: "footer",
					label: "フッタ（住所・TEL等／改行可）",
					multiline: true,
					initial_value: cfg.brand.footer ?? ""
				},
				{
					type: "text_input",
					action_id: "siteUrl",
					label: "サイトURL（フッタリンク）",
					initial_value: cfg.brand.siteUrl ?? ""
				},
				{
					type: "text_input",
					action_id: "fromAddress",
					label: "差出人 From（name@domain か Name <name@domain>）",
					placeholder: "有限会社○○ <noreply@example.com>",
					initial_value: cfg.from,
					required: true
				},
				{
					type: "text_input",
					action_id: "toEmails",
					label: "通知先メール（カンマ/改行区切りで複数可）",
					multiline: true,
					initial_value: cfg.toEmails.join("\n"),
					required: true
				},
				{
					type: "text_input",
					action_id: "bindingName",
					label: "send_email バインディング名",
					placeholder: DEFAULT_BINDING,
					initial_value: cfg.bindingName === DEFAULT_BINDING ? "" : cfg.bindingName
				},
				{
					type: "text_input",
					action_id: "turnstileSiteKey",
					label: "Turnstile サイトキー（公開）",
					initial_value: cfg.turnstileSiteKey
				},
				{
					type: "secret_input",
					action_id: "turnstileSecret",
					label: "Turnstile シークレットキー（空欄=変更なし）"
				},
				{
					type: "text_input",
					action_id: "notifySubject",
					label: "通知メール件名（{type}/{name} 使用可）",
					initial_value: cfg.notifySubject
				},
				{
					type: "toggle",
					action_id: "autoresponder",
					label: "送信者へ自動返信を送る",
					initial_value: cfg.autoresponder
				},
				{
					type: "text_input",
					action_id: "autoresponderSubject",
					label: "自動返信の件名",
					initial_value: cfg.autoresponderSubject
				},
				{
					type: "select",
					action_id: "template",
					label: "メールテンプレート",
					initial_value: cfg.template,
					options: [{
						value: "branded",
						label: "Branded（標準）"
					}]
				},
				{
					type: "text_input",
					action_id: "confirmMessage",
					label: "送信完了メッセージ（任意）",
					multiline: true,
					initial_value: cfg.confirmMessage
				},
				{
					type: "text_input",
					action_id: "fields",
					label: "フィールド定義（JSON配列・空=既定）",
					multiline: true,
					initial_value: JSON.stringify(cfg.fields, null, 2)
				}
			]
		}
	] };
}
async function saveSettings(ctx, values) {
	try {
		const setStr = async (key, v) => {
			const s = typeof v === "string" ? v.trim() : "";
			if (s) await ctx.kv.set(key, s);
			else await ctx.kv.delete(key);
		};
		if (typeof values.fromAddress === "string" && !parseFrom(values.fromAddress)) return {
			...await buildSettingsPage(ctx),
			toast: {
				message: "From は name@domain か Name <name@domain> 形式で入力してください",
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
					message: "フィールド定義が不正なJSONです",
					type: "error"
				}
			};
		}
		await setStr(K.orgName, values.orgName);
		await setStr(K.logoUrl, values.logoUrl);
		await setStr(K.brandColor, values.brandColor);
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
				message: "設定を保存しました",
				type: "success"
			}
		};
	} catch (err) {
		ctx.log.error("Failed to save contact form settings", err);
		return {
			...await buildSettingsPage(ctx),
			toast: {
				message: "保存に失敗しました",
				type: "error"
			}
		};
	}
}
async function buildSubmissionsPage(ctx) {
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
		text: "お問い合わせ送信履歴"
	}, {
		type: "table",
		blockId: "submissions-table",
		columns: [
			{
				key: "createdAt",
				label: "受信日時",
				format: "datetime"
			},
			{
				key: "category",
				label: "種別",
				format: "text"
			},
			{
				key: "name",
				label: "お名前",
				format: "text"
			},
			{
				key: "email",
				label: "メール",
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
