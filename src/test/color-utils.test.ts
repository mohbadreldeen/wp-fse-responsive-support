import { describe, expect, it } from "@jest/globals";
import { resolvePresetColorValue } from "../block-editor/color-utils";

describe("resolvePresetColorValue", () => {
	it("resolves plain preset slugs through the editor palette", () => {
		expect(
			resolvePresetColorValue("brand", [{ slug: "brand", color: "#123456" }]),
		).toBe("#123456");
	});

	it("resolves var:preset values through the editor palette", () => {
		expect(
			resolvePresetColorValue("var:preset|color|brand", [
				{ slug: "brand", color: "#123456" },
			]),
		).toBe("#123456");
	});

	it("resolves wp preset CSS variables through the editor palette", () => {
		expect(
			resolvePresetColorValue("var(--wp--preset--color--brand)", [
				{ slug: "brand", color: "#123456" },
			]),
		).toBe("#123456");
	});

	it("keeps custom color literals unchanged", () => {
		expect(resolvePresetColorValue("#ff0000", [])).toBe("#ff0000");
	});
});
