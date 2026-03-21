const SUPPORTED_PATH_TO_MAPPER: Record<string, string> = {
	"style.spacing.padding": "spacingPadding",
	"style.spacing.margin": "spacingMargin",
	"style.color.text": "textColor",
	"style.color.background": "backgroundColor",
	"style.border.radius": "borderRadius",
	"style.border.width": "borderWidth",
	"style.border.color": "borderColor",
};

/**
 *
 * @param {string} value: The camelCase string to convert to kebab-case.
 * @returns {string} The converted kebab-case string.
 * * @example
 * camelToKebab("spacingPadding") -> "spacing-padding"
 */
export const camelToKebab = (value: string) =>
	String(value || "")
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.toLowerCase();

/**
 *
 * @param {string} cssProperty: The kebab-case CSS property to convert to camelCase.
 * @returns {string} The converted camelCase string.
 * * @example
 * cssPropToJsProp("spacing-padding") -> "spacingPadding"
 */
export const cssPropToJsProp = (cssProperty: string) =>
	cssProperty.replace(/-([a-z])/g, (_match, char) => char.toUpperCase());

/**
 *
 * @param {any} value: The value to check.
 * @returns {boolean} True if the value is an object, false otherwise.
 */
export const isObject = (value: any) =>
	value && typeof value === "object" && !Array.isArray(value);

/**
 *
 * @param {Object | any[]} value: The value to clone.
 * @returns {Object | any[]} The cloned value.
 * @description Deep clones an object or array. For non-object values, it returns the value as-is. Note that this method does not handle functions, dates, or other complex types.
 */
export const clone = (value: Object | any[]) =>
	isObject(value) || Array.isArray(value)
		? JSON.parse(JSON.stringify(value))
		: value;

/**
 * Encodes a path key by replacing dots with double underscores.
 * @param {string} path: The path to encode.
 * @returns {string} The encoded path key.
 * @example
 * encodePathKey("style.spacing.padding") -> "style__spacing__padding"
 */
export const encodePathKey = (path: string) => path.replace(/\./g, "__");

export const normalizePath = (path: string) => String(path || "").trim();

export const getMapperForPath = (path: string) => {
	return SUPPORTED_PATH_TO_MAPPER[normalizePath(path)] || "";
};

export const getCssPropertyForPath = (path: string) => {
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
};

/**
 * Read a nested value using dot notation.
 * Example:
 *   getValueAtPath({ style: { spacing: { padding: "2rem" } } }, "style.spacing.padding")
 *   -> "2rem"
 */
export const getValueAtPath = (
	object: Record<string, any>,
	path: string,
): any => {
	if (!object || !path) {
		return undefined;
	}

	return path.split(".").reduce((acc: any, segment: string) => {
		if (acc === undefined || acc === null) {
			return undefined;
		}
		return acc[segment];
	}, object);
};

export const setValueAtPath = (
	object: Record<string, any>,
	path: string,
	value: any,
): Record<string, any> => {
	if (!path) {
		return object;
	}

	const segments = path.split(".");
	let cursor = object;

	segments.forEach((segment: string, index: number) => {
		if (index === segments.length - 1) {
			// If both current and new values are objects, merge them to preserve siblings
			if (isObject(cursor[segment]) && isObject(value)) {
				cursor[segment] = { ...cursor[segment], ...value };
			} else {
				cursor[segment] = value;
			}
			return;
		}

		if (!isObject(cursor[segment])) {
			cursor[segment] = {};
		}

		cursor = cursor[segment];
	});

	return object;
};

export const setResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: any,
	value: any,
): Record<string, any> => {
	const nextResponsiveStyles = clone(attributes?.responsiveStyles || {});
	if (!isObject(nextResponsiveStyles[device])) {
		nextResponsiveStyles[device] = {};
	}

	const pathKey = encodePathKey(target.path);

	if (target.valueKind === "object" && isObject(value)) {
		const existingValue = isObject(nextResponsiveStyles[device][pathKey])
			? nextResponsiveStyles[device][pathKey]
			: {};
		const nextValue = { ...existingValue };

		if (Array.isArray(target.leafKeys) && target.leafKeys.length) {
			target.leafKeys.forEach((key: string) => {
				if (Object.prototype.hasOwnProperty.call(value, key)) {
					nextValue[key] = clone(value[key]);
				}
			});
		} else {
			Object.assign(nextValue, clone(value));
		}

		nextResponsiveStyles[device][pathKey] = nextValue;
	} else {
		nextResponsiveStyles[device][pathKey] = clone(value);
	}

	return nextResponsiveStyles;
};

export const getResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: any,
): any => {
	const payload = attributes?.responsiveStyles?.[device];
	if (!isObject(payload)) {
		return undefined;
	}

	const pathKey = encodePathKey(target.path);
	if (payload[pathKey] !== undefined) {
		return payload[pathKey];
	}

	return undefined;
};
