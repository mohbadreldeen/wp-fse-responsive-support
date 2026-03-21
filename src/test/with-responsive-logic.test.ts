import { describe, expect, it } from "@jest/globals";
import { encodePathKey } from "../utils";
import {
	expandTrackedTargets,
	getSiblingAliasPath,
} from "../block-editor/responsive-target-families";
import { __withResponsiveLogicTestUtils } from "../block-editor/with-responsive-logic";
import type { ResponsiveTarget } from "../block-editor/types";

const makeTarget = (
	overrides: Partial<ResponsiveTarget>,
): ResponsiveTarget => ({
	block: "core/group",
	path: "style.color.background",
	valueKind: "scalar",
	leafKeys: [],
	mapper: "backgroundColor",
	sourceKind: "style-value",
	channel: "background",
	...overrides,
});

describe("expandTrackedTargets", () => {
	it("adds the preset alias for a style-value color target", () => {
		const targets = expandTrackedTargets([
			makeTarget({
				path: "style.border.color",
				mapper: "borderColor",
				sourceKind: "style-value",
				channel: "border",
			}),
		]);

		expect(targets.map((target) => target.path)).toEqual([
			"borderColor",
			"style.border.color",
		]);
	});

	it("deduplicates an already-selected alias pair", () => {
		const targets = expandTrackedTargets([
			makeTarget({
				path: "style.color.background",
				mapper: "backgroundColor",
				sourceKind: "style-value",
				channel: "background",
			}),
			makeTarget({
				path: "backgroundColor",
				mapper: "backgroundColor",
				sourceKind: "preset-slug",
				channel: "background",
			}),
		]);

		expect(targets.map((target) => target.path)).toEqual([
			"backgroundColor",
			"style.color.background",
		]);
	});

	it("returns sibling alias path for color family targets", () => {
		expect(
			getSiblingAliasPath(
				makeTarget({
					path: "style.border.color",
					mapper: "borderColor",
					sourceKind: "style-value",
					channel: "border",
				}),
			),
		).toBe("borderColor");

		expect(
			getSiblingAliasPath(
				makeTarget({
					path: "borderColor",
					mapper: "borderColor",
					sourceKind: "preset-slug",
					channel: "border",
				}),
			),
		).toBe("style.border.color");
	});
});

describe("buildResponsiveAttributeUpdate", () => {
	it("stores changed scalar values in responsive storage at current device", () => {
		const targets = expandTrackedTargets([
			makeTarget({
				path: "style.border.color",
				mapper: "borderColor",
				sourceKind: "style-value",
				channel: "border",
			}),
		]);

		const attributes = {
			borderColor: "contrast",
			responsiveStyles: {
				desktop: {
					[encodePathKey("borderColor")]: "contrast",
				},
			},
		};

		const nextAttributes =
			__withResponsiveLogicTestUtils.buildResponsiveAttributeUpdate(
				attributes,
				{
					style: {
						border: {
							color: "#0053b8",
						},
					},
				},
				"desktop",
				targets,
			);

		expect(nextAttributes).not.toBeNull();
		expect(nextAttributes?.responsiveStyles.desktop).toEqual({
			[encodePathKey("style.border.color")]: "#0053b8",
		});
	});
});

describe("buildDeviceSyncAttributes", () => {
	it("sets stale preset aliases to undefined when switching devices", () => {
		const targets = expandTrackedTargets([
			makeTarget({
				path: "style.border.color",
				mapper: "borderColor",
				sourceKind: "style-value",
				channel: "border",
			}),
		]);

		const attributes = {
			borderColor: "contrast",
			style: {
				border: {
					color: "#f9ff00",
				},
			},
			responsiveStyles: {
				desktop: {
					[encodePathKey("style.border.color")]: "#ff0000",
				},
				tablet: {
					[encodePathKey("borderColor")]: "contrast",
				},
				mobile: {
					[encodePathKey("style.border.color")]: "#f9ff00",
				},
			},
		};

		const nextAttributes =
			__withResponsiveLogicTestUtils.buildDeviceSyncAttributes(
				attributes,
				targets,
				"mobile",
				"desktop",
			);

		expect(
			Object.prototype.hasOwnProperty.call(nextAttributes, "borderColor"),
		).toBe(true);
		expect(nextAttributes.borderColor).toBe(undefined);
		expect(nextAttributes.style?.border?.color).toBe("#ff0000");
	});

	it("hydrates desktop style border color when switching from tablet preset alias", () => {
		const targets = expandTrackedTargets([
			makeTarget({
				path: "style.border.color",
				mapper: "borderColor",
				sourceKind: "style-value",
				channel: "border",
			}),
		]);

		const attributes = {
			borderColor: "contrast",
			responsiveStyles: {
				desktop: {
					[encodePathKey("style.border.color")]: "#ff0000",
				},
				tablet: {
					[encodePathKey("borderColor")]: "contrast",
				},
			},
		};

		const nextAttributes =
			__withResponsiveLogicTestUtils.buildDeviceSyncAttributes(
				attributes,
				targets,
				"tablet",
				"desktop",
			);

		expect(nextAttributes.style?.border?.color).toBe("#ff0000");
		expect(
			Object.prototype.hasOwnProperty.call(nextAttributes, "borderColor"),
		).toBe(true);
		expect(nextAttributes.borderColor).toBe(undefined);
	});
});
