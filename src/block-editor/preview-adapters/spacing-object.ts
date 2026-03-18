import { isObject } from "../../utils";
import type {
	PreviewAdapter,
	AdapterResolveResult,
	ResolvedChannels,
	ResponsiveTarget,
	PreviewStyleMap,
} from "../types";

type SideMap = { top: string; right: string; bottom: string; left: string };

const PADDING_PROPS: SideMap = {
	top: "padding-top",
	right: "padding-right",
	bottom: "padding-bottom",
	left: "padding-left",
};

const MARGIN_PROPS: SideMap = {
	top: "margin-top",
	right: "margin-right",
	bottom: "margin-bottom",
	left: "margin-left",
};

function expandSides(
	value: Record<string, unknown>,
	propMap: SideMap,
): PreviewStyleMap {
	const result: PreviewStyleMap = {};
	for (const side of ["top", "right", "bottom", "left"] as const) {
		const v = value[side];
		if (typeof v === "string" || typeof v === "number") {
			result[propMap[side]] = v;
		}
	}
	return result;
}

/**
 * Handles style.spacing.padding and style.spacing.margin object expansion.
 */
export const spacingObjectAdapter: PreviewAdapter = {
	id: "spacing-object",
	priority: 80,

	canHandle(target: ResponsiveTarget): boolean {
		return (
			target.path === "style.spacing.padding" ||
			target.path === "style.spacing.margin"
		);
	},

	resolve(target: ResponsiveTarget, value: unknown): AdapterResolveResult {
		if (!isObject(value)) {
			return { skip: true };
		}

		const propMap =
			target.path === "style.spacing.padding" ? PADDING_PROPS : MARGIN_PROPS;
		const cssProperties = expandSides(
			value as Record<string, unknown>,
			propMap,
		);

		if (!Object.keys(cssProperties).length) {
			return { skip: true };
		}

		return { cssProperties };
	},
};
