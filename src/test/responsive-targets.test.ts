import { describe, expect, it } from "@jest/globals";
import { listAttributeCandidates } from "../block-editor/target-discovery";

describe("listAttributeCandidates", () => {
	it("includes well-known border style targets by default", () => {
		const candidates = listAttributeCandidates({});
		const paths = candidates.map((candidate) => candidate.path);

		expect(paths).toContain("style.border.radius");
		expect(paths).toContain("style.border.width");
		expect(paths).toContain("style.border.color");
	});

	it("marks default style.border.color as style-value border channel", () => {
		const candidates = listAttributeCandidates({});
		const borderColor = candidates.find(
			(candidate) => candidate.path === "style.border.color",
		);

		expect(borderColor?.sourceKind).toBe("style-value");
		expect(borderColor?.channel).toBe("border");
	});

	it("skips non-actionable object container paths", () => {
		const attributes = {
			style: {
				type: "object",
				properties: {
					brder: {
						type: "object",
						properties: {
							radius: {
								type: "object",
								properties: {
									topLeft: { type: "string" },
								},
							},
						},
					},
				},
			},
		};

		const candidates = listAttributeCandidates(attributes);
		const paths = candidates.map((candidate) => candidate.path);

		expect(paths).not.toContain("style.brder");
		expect(paths).toContain("style.brder.radius");
	});

	it("keeps actionable object paths with direct scalar leaves", () => {
		const attributes = {
			style: {
				type: "object",
				properties: {
					spacing: {
						type: "object",
						properties: {
							padding: {
								type: "object",
								properties: {
									top: { type: "string" },
									right: { type: "string" },
									bottom: { type: "string" },
									left: { type: "string" },
								},
							},
						},
					},
				},
			},
		};

		const candidates = listAttributeCandidates(attributes);
		const padding = candidates.find(
			(candidate) => candidate.path === "style.spacing.padding",
		);

		expect(padding).toBeDefined();
		expect(padding?.valueKind).toBe("object");
		expect(padding?.leafKeys).toEqual(["top", "right", "bottom", "left"]);
	});

	it("prefers schema-discovered object border width over scalar default", () => {
		const attributes = {
			style: {
				type: "object",
				properties: {
					border: {
						type: "object",
						properties: {
							width: {
								type: "object",
								properties: {
									top: { type: "string" },
									right: { type: "string" },
									bottom: { type: "string" },
									left: { type: "string" },
								},
							},
						},
					},
				},
			},
		};

		const candidates = listAttributeCandidates(attributes);
		const width = candidates.find(
			(candidate) => candidate.path === "style.border.width",
		);

		expect(width?.valueKind).toBe("object");
		expect(width?.leafKeys).toEqual(["top", "right", "bottom", "left"]);
	});
});
