/**
 * Registers all built-in preview adapters into the shared registry.
 * Import this module once (from with-responsive-preview.tsx) to set up
 * the registry before the preview HOC runs.
 */
import { previewAdapterRegistry } from "../preview-adapter-registry";
import { colorStyleValueAdapter } from "./color-style-value";
import { colorPresetSlugAdapter } from "./color-preset-slug";
import { spacingObjectAdapter } from "./spacing-object";
import { borderGeometryAdapter } from "./border-geometry";
import { genericPathAdapter } from "./generic-path";

// --- Exact-path registrations ---
previewAdapterRegistry.register("style.color.text", colorStyleValueAdapter);
previewAdapterRegistry.register(
	"style.color.background",
	colorStyleValueAdapter,
);
previewAdapterRegistry.register("style.border.color", colorStyleValueAdapter);
previewAdapterRegistry.register("textColor", colorPresetSlugAdapter);
previewAdapterRegistry.register("backgroundColor", colorPresetSlugAdapter);
previewAdapterRegistry.register("borderColor", colorPresetSlugAdapter);
previewAdapterRegistry.register("style.spacing.padding", spacingObjectAdapter);
previewAdapterRegistry.register("style.spacing.margin", spacingObjectAdapter);
previewAdapterRegistry.register("style.border.radius", borderGeometryAdapter);
previewAdapterRegistry.register("style.border.width", borderGeometryAdapter);

// --- Catch-all fallback ---
previewAdapterRegistry.registerFallback(genericPathAdapter);
