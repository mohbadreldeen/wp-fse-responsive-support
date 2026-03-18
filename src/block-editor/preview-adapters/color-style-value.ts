import type {
	PreviewAdapter,
	AdapterResolveResult,
	ResolvedChannels,
	ResponsiveTarget,
} from "../types";

/**
 * Handles style.color.text → CSS `color`
 *         style.color.background → CSS `background-color`
 *
 * These carry literal color values entered by the user (e.g. #ff0000).
 * Priority 100 — always wins over preset-slug adapters.
 */
export const colorStyleValueAdapter: PreviewAdapter = {
	id: "color-style-value",
	priority: 100,

	canHandle(target: ResponsiveTarget): boolean {
		return (
			target.path === "style.color.text" ||
			target.path === "style.color.background"
		);
	},

	resolve(target: ResponsiveTarget, value: unknown): AdapterResolveResult {
		if (typeof value !== "string" || !value) {
			return { skip: true };
		}

		const cssProperty =
			target.path === "style.color.text" ? "color" : "background-color";

		return { cssProperty, cssValue: value };
	},
};
