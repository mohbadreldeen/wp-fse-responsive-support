import {
	camelToKebab,
	cssPropToJsProp,
	isObject,
	normalizePath,
} from "../../utils";
import type {
	PreviewAdapter,
	AdapterResolveResult,
	ResolvedChannels,
	ResponsiveTarget,
	PreviewStyleMap,
} from "../types";

/**
 * Convert a dotted style path to the closest CSS property name.
 * Mirrors the logic previously in getCssPropertyForPath() so behaviour is identical.
 */
function cssPropertyForPath(path: string): string {
	const normalizedPath = normalizePath(path);
	if (!normalizedPath || normalizedPath === "style") {
		return "";
	}

	const segments = normalizedPath.split(".");
	const leaf = segments[segments.length - 1];

	if (segments[0] !== "style") {
		return camelToKebab(leaf);
	}

	const namespace = segments[1] || "";

	if (namespace === "color") {
		if (leaf === "text") return "color";
		if (leaf === "background") return "background-color";
	}

	if (namespace === "border") {
		if (leaf === "color") return "border-color";
	}

	if (namespace === "spacing" && leaf === "blockGap") {
		return "gap";
	}

	if (namespace === "dimensions") {
		if (leaf === "minHeight") return "min-height";
		if (leaf === "aspectRatio") return "aspect-ratio";
	}

	return camelToKebab(leaf);
}

/**
 * Catch-all fallback adapter.
 *
 * Handles any scalar path not claimed by a more specific adapter, using the
 * same path-to-CSS-property conversion that existed previously.
 * Also handles generic objects by expanding via target.leafKeys or object keys.
 *
 * Priority 0 — runs last.
 */
export const genericPathAdapter: PreviewAdapter = {
	id: "generic-path",
	priority: 0,

	canHandle(_target: ResponsiveTarget): boolean {
		return true;
	},

	resolve(target: ResponsiveTarget, value: unknown): AdapterResolveResult {
		if (isObject(value)) {
			const obj = value as Record<string, unknown>;
			const leafKeys =
				Array.isArray(target.leafKeys) && target.leafKeys.length
					? target.leafKeys
					: Object.keys(obj);

			const cssProperties: PreviewStyleMap = {};
			leafKeys.forEach((leafKey) => {
				if (!Object.prototype.hasOwnProperty.call(obj, leafKey)) {
					return;
				}
				const v = obj[leafKey];
				if (typeof v !== "string" && typeof v !== "number") {
					return;
				}
				const cssProp = cssPropertyForPath(`${target.path}.${leafKey}`);
				if (cssProp) {
					cssProperties[cssPropToJsProp(cssProp)] = v;
				}
			});

			if (Object.keys(cssProperties).length) {
				return { cssProperties };
			}
			return { skip: true };
		}

		if (typeof value !== "string" && typeof value !== "number") {
			return { skip: true };
		}

		const cssProperty = cssPropertyForPath(target.path);
		if (!cssProperty) {
			return { skip: true };
		}

		return { cssProperty, cssValue: value };
	},
};
