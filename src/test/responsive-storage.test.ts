import { describe, expect, it } from "@jest/globals";
import { encodePathKey } from "../utils";
import {
	getResponsiveValueWithFallback,
	removeResponsiveValue,
	setResponsiveValue,
} from "../block-editor/responsive-targets";
import type { ResponsiveTarget } from "../block-editor/types";

const makeTarget = (
	overrides: Partial<ResponsiveTarget>,
): ResponsiveTarget => ({
	block: "core/paragraph",
	path: "style.color.background",
	valueKind: "scalar",
	leafKeys: [],
	mapper: "backgroundColor",
	...overrides,
});

describe("setResponsiveValue", () => {
	it("writes scalar responsive value to encoded path key", () => {
		const target = makeTarget({ path: "style.typography.fontSize" });

		const next = setResponsiveValue({}, "tablet", target, "1.2rem");

		expect(next.tablet[encodePathKey("style.typography.fontSize")]).toBe(
			"1.2rem",
		);
	});

	it("merges object values by leaf keys without dropping existing keys", () => {
		const target = makeTarget({
			path: "style.spacing.padding",
			valueKind: "object",
			leafKeys: ["top", "right", "bottom", "left"],
			mapper: "spacingPadding",
		});

		const existing = {
			responsiveStyles: {
				tablet: {
					[encodePathKey("style.spacing.padding")]: {
						top: "10px",
						right: "8px",
						bottom: "6px",
						left: "4px",
					},
				},
			},
		};

		const next = setResponsiveValue(existing, "tablet", target, {
			top: "20px",
			left: "12px",
		});

		expect(next.tablet[encodePathKey("style.spacing.padding")]).toEqual({
			top: "20px",
			right: "8px",
			bottom: "6px",
			left: "12px",
		});
	});

	it("removes backgroundColor when style.color.background is set", () => {
		const target = makeTarget({ path: "style.color.background" });
		const existing = {
			responsiveStyles: {
				tablet: {
					[encodePathKey("backgroundColor")]: "var:preset|color|contrast",
				},
			},
		};

		const next = setResponsiveValue(existing, "tablet", target, "#112233");

		expect(next.tablet[encodePathKey("style.color.background")]).toBe(
			"#112233",
		);
		expect(next.tablet[encodePathKey("backgroundColor")]).toBeUndefined();
	});

	it("removes style.color.background when backgroundColor is set", () => {
		const target = makeTarget({
			path: "backgroundColor",
			mapper: "backgroundColor",
		});
		const existing = {
			responsiveStyles: {
				mobile: {
					[encodePathKey("style.color.background")]: "#00ffaa",
				},
			},
		};

		const next = setResponsiveValue(existing, "mobile", target, "base");

		expect(next.mobile[encodePathKey("backgroundColor")]).toBe("base");
		expect(
			next.mobile[encodePathKey("style.color.background")],
		).toBeUndefined();
	});

	it("keeps text aliases mutually exclusive", () => {
		const target = makeTarget({
			path: "style.color.text",
			mapper: "textColor",
		});
		const existing = {
			responsiveStyles: {
				tablet: {
					[encodePathKey("textColor")]: "var:preset|color|primary",
				},
			},
		};

		const next = setResponsiveValue(existing, "tablet", target, "#333333");

		expect(next.tablet[encodePathKey("style.color.text")]).toBe("#333333");
		expect(next.tablet[encodePathKey("textColor")]).toBeUndefined();
	});

	it("removes borderColor when style.border.color is set", () => {
		const target = makeTarget({
			path: "style.border.color",
			mapper: "borderColor",
		});
		const existing = {
			responsiveStyles: {
				tablet: {
					[encodePathKey("borderColor")]: "brand",
				},
			},
		};

		const next = setResponsiveValue(existing, "tablet", target, "#0053b8");

		expect(next.tablet[encodePathKey("style.border.color")]).toBe("#0053b8");
		expect(next.tablet[encodePathKey("borderColor")]).toBeUndefined();
	});

	it("removes style.border.color when borderColor is set", () => {
		const target = makeTarget({
			path: "borderColor",
			mapper: "borderColor",
		});
		const existing = {
			responsiveStyles: {
				mobile: {
					[encodePathKey("style.border.color")]: "#0053b8",
				},
			},
		};

		const next = setResponsiveValue(existing, "mobile", target, "contrast");

		expect(next.mobile[encodePathKey("borderColor")]).toBe("contrast");
		expect(next.mobile[encodePathKey("style.border.color")]).toBeUndefined();
	});
});

describe("removeResponsiveValue", () => {
	it("does not remove backgroundColor when clearing style.color.background", () => {
		const target = makeTarget({ path: "style.color.background" });
		const existing = {
			responsiveStyles: {
				tablet: {
					[encodePathKey("backgroundColor")]: "brand",
					[encodePathKey("style.color.background")]: "#eb2626",
				},
			},
		};

		const next = removeResponsiveValue(existing, "tablet", target);

		expect(
			next.tablet[encodePathKey("style.color.background")],
		).toBeUndefined();
		expect(next.tablet[encodePathKey("backgroundColor")]).toBe("brand");
	});

	it("does not remove style.color.background when clearing backgroundColor", () => {
		const target = makeTarget({ path: "backgroundColor" });
		const existing = {
			responsiveStyles: {
				tablet: {
					[encodePathKey("backgroundColor")]: "brand",
					[encodePathKey("style.color.background")]: "#eb2626",
				},
			},
		};

		const next = removeResponsiveValue(existing, "tablet", target);

		expect(next.tablet[encodePathKey("backgroundColor")]).toBeUndefined();
		expect(next.tablet[encodePathKey("style.color.background")]).toBe(
			"#eb2626",
		);
	});
});

describe("getResponsiveValueWithFallback", () => {
	it("falls back from tablet to desktop", () => {
		const target = makeTarget({ path: "style.typography.fontSize" });
		const attributes = {
			responsiveStyles: {
				desktop: {
					[encodePathKey("style.typography.fontSize")]: "20px",
				},
			},
		};

		expect(getResponsiveValueWithFallback(attributes, "tablet", target)).toBe(
			"20px",
		);
	});

	it("falls back from mobile to tablet then desktop", () => {
		const target = makeTarget({ path: "style.typography.fontSize" });
		const withTablet = {
			responsiveStyles: {
				tablet: {
					[encodePathKey("style.typography.fontSize")]: "18px",
				},
				desktop: {
					[encodePathKey("style.typography.fontSize")]: "20px",
				},
			},
		};

		expect(getResponsiveValueWithFallback(withTablet, "mobile", target)).toBe(
			"18px",
		);

		const desktopOnly = {
			responsiveStyles: {
				desktop: {
					[encodePathKey("style.typography.fontSize")]: "20px",
				},
			},
		};

		expect(getResponsiveValueWithFallback(desktopOnly, "mobile", target)).toBe(
			"20px",
		);
	});

	it("suppresses preset alias when style alias exists on current device", () => {
		const presetTarget = makeTarget({
			path: "backgroundColor",
			mapper: "backgroundColor",
		});
		const styleTarget = makeTarget({
			path: "style.color.background",
			mapper: "backgroundColor",
		});
		const attributes = {
			responsiveStyles: {
				desktop: {
					[encodePathKey("backgroundColor")]: "brand",
				},
				tablet: {
					[encodePathKey("style.color.background")]: "#ff0000",
				},
			},
		};

		expect(
			getResponsiveValueWithFallback(attributes, "tablet", presetTarget),
		).toBeUndefined();
		expect(
			getResponsiveValueWithFallback(attributes, "tablet", styleTarget),
		).toBe("#ff0000");
	});

	it("suppresses preset alias when style alias exists in fallback chain", () => {
		const presetTarget = makeTarget({
			path: "backgroundColor",
			mapper: "backgroundColor",
		});
		const attributes = {
			responsiveStyles: {
				desktop: {
					[encodePathKey("backgroundColor")]: "brand",
				},
				tablet: {
					[encodePathKey("style.color.background")]: "#ff0000",
				},
			},
		};

		expect(
			getResponsiveValueWithFallback(attributes, "mobile", presetTarget),
		).toBeUndefined();
	});

	it("keeps explicit mobile preset alias over tablet style fallback", () => {
		const presetTarget = makeTarget({
			path: "backgroundColor",
			mapper: "backgroundColor",
		});
		const attributes = {
			responsiveStyles: {
				desktop: {
					[encodePathKey("backgroundColor")]: "brand",
				},
				tablet: {
					[encodePathKey("style.color.background")]: "#ff0000",
				},
				mobile: {
					[encodePathKey("backgroundColor")]: "brand",
				},
			},
		};

		expect(
			getResponsiveValueWithFallback(attributes, "mobile", presetTarget),
		).toBe("brand");
	});
});
