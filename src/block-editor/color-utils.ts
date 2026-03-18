import { normalizePath } from "../utils";
import type { ResponsiveColorChannel, ResponsiveSourceKind } from "./types";

export type ColorTargetMeta = {
	sourceKind: ResponsiveSourceKind;
	channel: ResponsiveColorChannel | undefined;
};

const COLOR_META_MAP: Record<string, ColorTargetMeta> = {
	"style.color.text": { sourceKind: "style-value", channel: "text" },
	"style.color.background": {
		sourceKind: "style-value",
		channel: "background",
	},
	textColor: { sourceKind: "preset-slug", channel: "text" },
	backgroundColor: { sourceKind: "preset-slug", channel: "background" },
};

const GENERIC_META: ColorTargetMeta = {
	sourceKind: "generic",
	channel: undefined,
};

export const getColorTargetMeta = (path: string): ColorTargetMeta =>
	COLOR_META_MAP[normalizePath(path)] ?? GENERIC_META;

/**
 * Resolve a Gutenberg preset slug or existing color value to a CSS-ready string.
 *
 * Accepted input forms:
 *   "var:preset|color|slug"        → var(--wp--preset--color--slug)
 *   "var(--wp--preset--color--…)"  → returned as-is
 *   any CSS color literal           → returned as-is
 *   plain slug e.g. "vivid-red"    → var(--wp--preset--color--vivid-red)
 */
export const resolvePresetColorValue = (rawValue: string): string => {
	const value = String(rawValue || "").trim();
	if (!value) {
		return value;
	}

	if (value.startsWith("var(--wp--preset--color--")) {
		return value;
	}

	if (value.startsWith("var:preset|color|")) {
		const slug = value.slice("var:preset|color|".length);
		return slug ? `var(--wp--preset--color--${slug})` : value;
	}

	if (
		value.startsWith("#") ||
		value.startsWith("rgb(") ||
		value.startsWith("rgba(") ||
		value.startsWith("hsl(") ||
		value.startsWith("hsla(") ||
		value.startsWith("var(")
	) {
		return value;
	}

	const slug = value
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	return slug ? `var(--wp--preset--color--${slug})` : value;
};
