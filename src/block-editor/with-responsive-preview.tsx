import { createHigherOrderComponent } from "@wordpress/compose";
import { useSelect } from "@wordpress/data";
import { cssPropToJsProp } from "../utils";
import { useActiveTargets } from "./targets-store";
import { getResponsiveValueWithFallback } from "./responsive-targets";
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
			const targets = useActiveTargets(props.name);
			if (!targets.length) {
				return <BlockListBlock {...props} />;
			}

			const deviceType = useSelect(
				(select) =>
					(select("core/editor") as any).getDeviceType?.() || "Desktop",
				[],
			);
			const device = ((deviceType as string) || "Desktop").toLowerCase();

			if (device === "desktop") {
				return <BlockListBlock {...props} />;
			}

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
					previewStyles[cssPropToJsProp(result.cssProperty)] = result.cssValue;
					if (target.channel && target.sourceKind) {
						resolvedChannels[target.channel] = target.sourceKind;
					}
					return;
				}

				if ("cssProperties" in result) {
					Object.entries(result.cssProperties).forEach(([prop, val]) => {
						// Adapter may emit kebab-case or already-camelCase keys.
						const jsProp = prop.includes("-") ? cssPropToJsProp(prop) : prop;
						previewStyles[jsProp] = val;
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
