const path = require("path");
const defaults = require("@wordpress/scripts/config/webpack.config.js");

module.exports = {
	...defaults,
	mode: "development",
	entry: {
		...defaults.entry(),
		"themeplix-block-editor": path.resolve(process.cwd(), "src/block-editor", "index.ts"),
	},
	module: {
		...defaults.module,
		rules: [
			...defaults.module.rules,
			{
				test: /\.svg$/,
				use: ["@svgr/webpack"],
			},
		],
	},
	resolve: {
		extensions: [
			".ts",
			".tsx",
			...(defaults.resolve
				? defaults.resolve.extensions || [".js", ".jsx"]
				: []),
		],
	},
};
