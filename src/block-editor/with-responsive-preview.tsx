import { createHigherOrderComponent } from "@wordpress/compose";
import { useSelect } from "@wordpress/data";
import { cssPropToJsProp } from "../utils";
import { resolvePresetColorValue } from "./color-utils";
import { useActiveTargets } from "./targets-store";
import { getResponsiveValueWithFallback } from "./responsive-targets";
import { expandTrackedTargets } from "./responsive-target-families";
import { previewAdapterRegistry } from "./preview-adapter-registry";
import "./preview-adapters/index";
import type {
	ResponsiveTarget,
	ResolvedChannels,
	AdapterResolveResult,
} from "./types";
export const withResponsivePreview = createHigherOrderComponent(
	(BlockListBlock: any) => {
		return (props: any) => {
			const activeTargets = useActiveTargets(props.name);
			const targets = expandTrackedTargets(activeTargets);
			if (!targets.length) {
				return <BlockListBlock {...props} />;
			}

			const deviceType = useSelect(
				(select) =>
					(select("core/editor") as any).getDeviceType?.() || "Desktop",
				[],
			);
			const paletteColors = useSelect(
				(select) =>
					(select("core/block-editor") as any)?.getSettings?.()?.colors || [],
				[],
			) as Array<{ slug?: string; color?: string }>;
			const device = ((deviceType as string) || "Desktop").toLowerCase();

			const { attributes } = props;
			const previewStyles: Record<string, string | number> = {};
			const resolvedChannels: ResolvedChannels = {};

			targets.forEach((target: ResponsiveTarget) => {
				const responsiveValue = getResponsiveValueWithFallback(
					attributes,
					device,
					target,
				);
				if (responsiveValue === undefined) {
					return;
				}

				const adapter = previewAdapterRegistry.resolve(target);
				if (!adapter) {
					return;
				}

				const result: AdapterResolveResult = adapter.resolve(
					target,
					responsiveValue,
					resolvedChannels,
				);

				if ("skip" in result) {
					return;
				}

				if ("cssProperty" in result) {
					previewStyles[cssPropToJsProp(result.cssProperty)] =
						typeof result.cssValue === "string"
							? resolvePresetColorValue(result.cssValue, paletteColors)
							: result.cssValue;
					if (target.channel && target.sourceKind) {
						resolvedChannels[target.channel] = target.sourceKind;
					}
					return;
				}

				if ("cssProperties" in result) {
					Object.entries(result.cssProperties).forEach(([prop, val]) => {
						// Adapter may emit kebab-case or already-camelCase keys.
						const jsProp = prop.includes("-") ? cssPropToJsProp(prop) : prop;
						previewStyles[jsProp] =
							typeof val === "string"
								? resolvePresetColorValue(val, paletteColors)
								: val;
					});
				}
			});

			if (!Object.keys(previewStyles).length) {
				return <BlockListBlock {...props} />;
			}

			return (
				<BlockListBlock
					{...props}
					wrapperProps={{
						...(props.wrapperProps || {}),
						style: {
							...(props.wrapperProps?.style || {}),
							...previewStyles,
						},
					}}
				/>
			);
		};
	},
	"withResponsivePreview",
);
