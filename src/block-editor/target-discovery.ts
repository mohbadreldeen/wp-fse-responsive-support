import {
	clone,
	normalizePath,
	getCssPropertyForPath,
	isObject,
} from "../utils";
import { getColorTargetMeta } from "./color-utils";
import { ResponsiveTarget } from "./types";

const DEFAULT_TARGETS: string[] = [];
const STYLE_STRATEGY_BY_PATH: Record<
	string,
	ResponsiveTarget["styleStrategy"]
> = {
	"style.spacing.padding": "padding",
	"style.spacing.margin": "margin",
	"style.border.radius": "border-radius",
	"style.border.width": "border-width",
	"style.border.color": "border-color",
	"style.border.style": "border-style",
};

const DEFAULT_STYLE_TARGETS = [
	{
		path: "style.spacing.padding",
		valueKind: "object",
		leafKeys: ["top", "right", "bottom", "left"],
		styleStrategy: "padding",
		sourceKind: "generic",
		channel: undefined,
	},
	{
		path: "style.spacing.margin",
		valueKind: "object",
		leafKeys: ["top", "right", "bottom", "left"],
		styleStrategy: "margin",
		sourceKind: "generic",
		channel: undefined,
	},
	{
		path: "style.color.text",
		valueKind: "scalar",
		leafKeys: [],
		cssProperty: "color",
		sourceKind: "style-value",
		channel: "text",
	},
	{
		path: "style.color.background",
		valueKind: "scalar",
		leafKeys: [],
		cssProperty: "background-color",
		sourceKind: "style-value",
		channel: "background",
	},
	{
		path: "style.border.radius",
		valueKind: "object",
		leafKeys: ["topLeft", "topRight", "bottomRight", "bottomLeft"],
		styleStrategy: "border-radius",
		sourceKind: "generic",
		channel: undefined,
	},
	{
		path: "style.border.width",
		valueKind: "object",
		leafKeys: ["top", "right", "bottom", "left"],
		styleStrategy: "border-width",
		sourceKind: "generic",
		channel: undefined,
	},
	{
		path: "style.border.color",
		valueKind: "object",
		leafKeys: ["top", "right", "bottom", "left"],
		styleStrategy: "border-color",
		sourceKind: "style-value",
		channel: "border",
	},
];

const getStyleStrategyForPath = (
	path: string,
): ResponsiveTarget["styleStrategy"] => {
	return STYLE_STRATEGY_BY_PATH[path];
};

export const normalizeTargets = (rawTargets: any) => {
	if (!Array.isArray(rawTargets) || !rawTargets.length) {
		return clone(DEFAULT_TARGETS);
	}

	// Generic object paths that should never be targets (too broad)
	const FORBIDDEN_PATHS = ["style"];

	return rawTargets
		.filter((target) => {
			if (!target?.block || !target?.path) {
				return false;
			}

			const normalizedPath = normalizePath(target.path);
			if (!normalizedPath) {
				return false;
			}

			// Reject generic object paths
			if (FORBIDDEN_PATHS.includes(normalizedPath.toLowerCase())) {
				if (window.console && window.console.warn) {
					window.console.warn(
						"[RO] Rejecting generic target path:",
						normalizedPath,
						"for block:",
						target.block,
					);
				}
				return false;
			}

			return true;
		})
		.map((target) => {
			const normalizedPath = normalizePath(target.path);
			const colorMeta = getColorTargetMeta(normalizedPath);
			const cssProperty =
				typeof target.cssProperty === "string" ? target.cssProperty.trim() : "";
			const styleStrategy =
				typeof target.styleStrategy === "string"
					? (target.styleStrategy as ResponsiveTarget["styleStrategy"])
					: getStyleStrategyForPath(normalizedPath);

			const normalized = {
				block: String(target.block),
				path: normalizedPath,
				valueKind: target.valueKind === "scalar" ? "scalar" : "object",
				leafKeys: Array.isArray(target.leafKeys)
					? target.leafKeys.map(String)
					: [],
				cssProperty,
				styleStrategy,
				sourceKind: target.sourceKind
					? String(target.sourceKind)
					: colorMeta.sourceKind,
				channel: target.channel ? String(target.channel) : colorMeta.channel,
			};

			if (normalized.valueKind === "scalar" && !normalized.cssProperty) {
				return null;
			}

			if (normalized.valueKind === "object" && !normalized.styleStrategy) {
				return null;
			}

			return normalized;
		})
		.filter(Boolean) as ResponsiveTarget[];
};

const detectValueKind = (value: any) => {
	if (isObject(value)) {
		return "object";
	}
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return "scalar";
	}
	return null;
};

export const listAttributeCandidates = (
	attributes: Record<string, any>,
	pathPrefix = "",
	depth = 0,
) => {
	if (!isObject(attributes) || depth > 4) {
		return [];
	}

	const candidates = [];
	const hiddenAttributes = [
		"tagName",
		"templateLock",
		"metadata",
		"allowedBlocks",
		"ariaLabel",
	];
	const forbiddenPaths = new Set(["style"]);

	// Always include well-known style paths regardless of schema discovery
	if (depth === 0 && !pathPrefix) {
		candidates.push(...DEFAULT_STYLE_TARGETS);
	}

	Object.entries(attributes).forEach(([attrName, schema]) => {
		const path = pathPrefix ? `${pathPrefix}.${attrName}` : attrName;
		const type = schema?.type;

		// Skip internal/control attributes at top level
		if (depth === 0 && attrName === "responsiveStyles") {
			return;
		}

		if (depth === 0 && hiddenAttributes.includes(attrName)) {
			return;
		}

		if (type === "object" && isObject(schema?.properties)) {
			if (!forbiddenPaths.has(path)) {
				const colorMeta = getColorTargetMeta(path);
				const leafKeys = Object.entries(schema.properties)
					.filter(([, childSchema]: [string, any]) => {
						const childType = childSchema?.type;
						return (
							childType === "string" ||
							childType === "number" ||
							childType === "boolean"
						);
					})
					.map(([key]) => key);
				const styleStrategy = getStyleStrategyForPath(path);

				// Only expose object paths that are directly actionable.
				// This avoids surfacing container/typo paths like `style.brder`
				// that have nested children but no usable direct value contract.
				if ((leafKeys.length || colorMeta.channel) && styleStrategy) {
					candidates.push({
						path,
						valueKind: "object",
						leafKeys,
						styleStrategy,
						sourceKind: colorMeta.sourceKind,
						channel: colorMeta.channel,
					});
				}
			}

			candidates.push(
				...listAttributeCandidates(schema.properties, path, depth + 1),
			);
			return;
		}

		const valueKind =
			detectValueKind(schema?.default) ||
			(type === "object" ? "object" : "scalar");
		if (!valueKind) {
			return;
		}

		// Skip generic object-type attributes without explicit CSS mapping
		// to prevent selecting overly broad paths like "style"
		if (valueKind === "object" || forbiddenPaths.has(path)) {
			return;
		}

		const cssProperty = getCssPropertyForPath(path);
		if (!cssProperty) {
			return;
		}

		candidates.push({
			path,
			valueKind,
			leafKeys: [],
			cssProperty,
			...getColorTargetMeta(path),
		});
	});

	// Deduplicate by path
	const deduped = new Map();
	candidates.forEach((candidate) => {
		deduped.set(candidate.path, candidate);
	});

	return Array.from(deduped.values());
};
