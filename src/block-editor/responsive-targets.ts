import { clone, encodePathKey, isObject } from "../utils";
import type { ResponsiveTarget } from "./types";

type WriteNormalizationContext = {
	devicePayload: Record<string, any>;
	target: ResponsiveTarget;
};

interface ResponsiveWriteAdapter {
	readonly id: string;
	readonly priority: number;
	canHandle(target: ResponsiveTarget): boolean;
	normalize(context: WriteNormalizationContext): void;
}

class ResponsiveWriteAdapterRegistry {
	private readonly adapters: ResponsiveWriteAdapter[] = [];

	register(adapter: ResponsiveWriteAdapter): void {
		this.adapters.push(adapter);
		this.adapters.sort((a, b) => b.priority - a.priority);
	}

	resolve(target: ResponsiveTarget): ResponsiveWriteAdapter | undefined {
		return this.adapters.find((adapter) => adapter.canHandle(target));
	}
}

const COLOR_ALIAS_CONFLICTS: Record<string, string[]> = {
	"style.color.background": ["backgroundColor"],
	backgroundColor: ["style.color.background"],
	"style.color.text": ["textColor"],
	textColor: ["style.color.text"],
	"style.border.color": ["borderColor"],
	borderColor: ["style.border.color"],
};

const colorAliasWriteAdapter: ResponsiveWriteAdapter = {
	id: "color-alias-write-adapter",
	priority: 100,
	canHandle(target: ResponsiveTarget) {
		return Object.prototype.hasOwnProperty.call(
			COLOR_ALIAS_CONFLICTS,
			target.path,
		);
	},
	normalize({ devicePayload, target }: WriteNormalizationContext) {
		const conflictingPaths = COLOR_ALIAS_CONFLICTS[target.path] || [];
		conflictingPaths.forEach((path) => {
			const key = encodePathKey(path);
			if (devicePayload[key] !== undefined) {
				delete devicePayload[key];
			}
		});
	},
};

const responsiveWriteAdapterRegistry = new ResponsiveWriteAdapterRegistry();
responsiveWriteAdapterRegistry.register(colorAliasWriteAdapter);

const getDeviceFallbackChain = (device: string): string[] => {
	const normalizedDevice = String(device || "desktop").toLowerCase();

	if (normalizedDevice === "mobile") {
		return ["mobile", "tablet", "desktop"];
	}

	if (normalizedDevice === "tablet") {
		return ["tablet", "desktop"];
	}

	return ["desktop"];
};

const PRESET_TO_STYLE_ALIAS: Record<string, string> = {
	backgroundColor: "style.color.background",
	textColor: "style.color.text",
	borderColor: "style.border.color",
};

export const setResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
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

	try {
		const adapter = responsiveWriteAdapterRegistry.resolve(target);
		if (adapter && isObject(nextResponsiveStyles[device])) {
			adapter.normalize({
				devicePayload: nextResponsiveStyles[device],
				target,
			});
		}
	} catch (e) {
		// Defensive: don't let this helper throw in edge cases.
	}

	return nextResponsiveStyles;
};

export const removeResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
): Record<string, any> => {
	const nextResponsiveStyles = clone(attributes?.responsiveStyles || {});
	if (!isObject(nextResponsiveStyles[device])) {
		nextResponsiveStyles[device] = {};
	}

	const pathKey = encodePathKey(target.path);
	if (nextResponsiveStyles[device][pathKey] !== undefined) {
		delete nextResponsiveStyles[device][pathKey];
	}

	return nextResponsiveStyles;
};

export const getResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
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

export const getResponsiveValueWithFallback = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
	includeCurrentDevice = true,
): any => {
	const fallbackChain = getDeviceFallbackChain(device);
	const devicesToCheck = includeCurrentDevice
		? fallbackChain
		: fallbackChain.slice(1);
	const styleAliasPath = PRESET_TO_STYLE_ALIAS[target.path];
	const styleAliasTarget = styleAliasPath
		? {
				...target,
				path: styleAliasPath,
		  }
		: null;

	for (const fallbackDevice of devicesToCheck) {
		if (styleAliasTarget) {
			const styleAliasValue = getResponsiveValue(
				attributes,
				fallbackDevice,
				styleAliasTarget,
			);

			if (styleAliasValue !== undefined) {
				// Style-value aliases win at this precedence level, and block lower-level preset fallback.
				return undefined;
			}
		}

		const value = getResponsiveValue(attributes, fallbackDevice, target);
		if (value !== undefined) {
			return value;
		}
	}

	return undefined;
};
