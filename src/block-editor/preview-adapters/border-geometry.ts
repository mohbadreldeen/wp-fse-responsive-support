import { isObject } from "../../utils";
import type {
	PreviewAdapter,
	AdapterResolveResult,
	ResolvedChannels,
	ResponsiveTarget,
	PreviewStyleMap,
} from "../types";

type RadiusMap = {
	topLeft: string;
	topRight: string;
	bottomRight: string;
	bottomLeft: string;
};

type WidthMap = { top: string; right: string; bottom: string; left: string };

const RADIUS_PROPS: RadiusMap = {
	topLeft: "border-top-left-radius",
	topRight: "border-top-right-radius",
	bottomRight: "border-bottom-right-radius",
	bottomLeft: "border-bottom-left-radius",
};

const WIDTH_PROPS: WidthMap = {
	top: "border-top-width",
	right: "border-right-width",
	bottom: "border-bottom-width",
	left: "border-left-width",
};

function expandBorderObject(
	value: Record<string, unknown>,
	propMap: Record<string, string>,
): PreviewStyleMap {
	const result: PreviewStyleMap = {};
	for (const key of Object.keys(propMap)) {
		const v = value[key];
		if (typeof v === "string" || typeof v === "number") {
			result[propMap[key]] = v;
		}
	}
	return result;
}

/**
 * Handles style.border.radius → border-*-radius CSS properties (corners).
 *         style.border.width  → border-*-width CSS properties (sides).
 */
export const borderGeometryAdapter: PreviewAdapter = {
	id: "border-geometry",
	priority: 80,

	canHandle(target: ResponsiveTarget): boolean {
		return (
			target.path === "style.border.radius" ||
			target.path === "style.border.width"
		);
	},

	resolve(target: ResponsiveTarget, value: unknown): AdapterResolveResult {
		if (
			target.path === "style.border.width" &&
			(typeof value === "string" || typeof value === "number")
		) {
			return { cssProperty: "border-width", cssValue: value };
		}

		if (!isObject(value)) {
			return { skip: true };
		}

		const propMap =
			target.path === "style.border.radius" ? RADIUS_PROPS : WIDTH_PROPS;
		const cssProperties = expandBorderObject(
			value as Record<string, unknown>,
			propMap,
		);

		if (!Object.keys(cssProperties).length) {
			return { skip: true };
		}

		return { cssProperties };
	},
};
