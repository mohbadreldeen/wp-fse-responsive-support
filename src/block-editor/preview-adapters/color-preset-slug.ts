import { cssPropToJsProp } from "../../utils";
import { resolvePresetColorValue } from "../color-utils";
import type {
	PreviewAdapter,
	AdapterResolveResult,
	ResolvedChannels,
	ResponsiveColorChannel,
	ResponsiveTarget,
} from "../types";

/**
 * Handles textColor → CSS `color` (via preset slug)
 *         backgroundColor → CSS `background-color` (via preset slug)
 *
 * Preset slugs are resolved to var(--wp--preset--color--<slug>).
 * Priority 50 — defers to style-value adapters (priority 100) for the same channel.
 */
export const colorPresetSlugAdapter: PreviewAdapter = {
	id: "color-preset-slug",
	priority: 50,

	canHandle(target: ResponsiveTarget): boolean {
		return target.path === "textColor" || target.path === "backgroundColor";
	},

	resolve(
		target: ResponsiveTarget,
		value: unknown,
		resolvedChannels: ResolvedChannels,
	): AdapterResolveResult {
		if (typeof value !== "string" || !value) {
			return { skip: true };
		}

		const channel: ResponsiveColorChannel =
			target.path === "textColor" ? "text" : "background";

		// Yield to a style-value that was already applied for this channel.
		if (resolvedChannels[channel] === "style-value") {
			return { skip: true };
		}

		const cssProperty = channel === "text" ? "color" : "background-color";
		const cssValue = resolvePresetColorValue(value);

		if (!cssValue) {
			return { skip: true };
		}

		return { cssProperty, cssValue };
	},
};
