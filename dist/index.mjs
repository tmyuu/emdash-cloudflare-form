//#region src/index.ts
function cloudflareForm() {
	return {
		id: "cf-form",
		version: "0.6.0",
		format: "standard",
		entrypoint: "emdash-cloudflare-form/sandbox",
		adminPages: [{
			path: "/settings",
			label: "Contact Form",
			icon: "mail"
		}, {
			path: "/submissions",
			label: "Form Submissions",
			icon: "inbox"
		}],
		storage: { submissions: { indexes: ["createdAt"] } }
	};
}
//#endregion
export { cloudflareForm, cloudflareForm as default };
