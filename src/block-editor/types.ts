export type ValueKind = "scalar" | "object";
export type StyleStrategy =
	| "padding"
	| "margin"
	| "border-radius"
	| "border-width"
	| "border-color"
	| "border-style";

export type ResponsiveSourceKind = "style-value" | "preset-slug" | "generic";
export type ResponsiveColorChannel = "text" | "background" | "border";

export type ResponsiveTarget = {
	block: string;
	path: string;
	valueKind: ValueKind;
	leafKeys: string[];
	cssProperty?: string;
	styleStrategy?: StyleStrategy;
	sourceKind?: ResponsiveSourceKind;
	channel?: ResponsiveColorChannel;
};

export type SelectedMap = Record<string, ResponsiveTarget>;

export type FeedbackState = {
	status: "success" | "error";
	message: string;
} | null;

export type RuntimeSettings = {
	restPath?: string;
	nonce?: string;
	config?: {
		targets?: unknown[];
	};
};

export type ApiTargetsResponse = {
	targets?: unknown[];
};

export type DiscoverableBlock = {
	name: string;
	title: string;
	attributes: ResponsiveTarget[];
};

export type BlockType = {
	name: string;
	title?: string;
	attributes?: Record<string, unknown>;
};

export type ExtendedWindow = Window & {
	responsiveOverridesSettings?: RuntimeSettings;
};

// ---------------------------------------------------------------------------
// Preview adapter contracts
// ---------------------------------------------------------------------------

export type PreviewStyleMap = Record<string, string | number>;

/**
 * Tracks which CSS channel has already been resolved and by which source.
 * Used to enforce style-value > preset-slug precedence.
 */
export type ResolvedChannels = Partial<
	Record<ResponsiveColorChannel, ResponsiveSourceKind>
>;

export type AdapterResolveResult =
	| { skip: true }
	| { cssProperty: string; cssValue: string | number }
	| { cssProperties: PreviewStyleMap };

export interface PreviewAdapter {
	/** Unique identifier used for debugging / registry keys. */
	readonly id: string;

	/** Higher value = applied first in the preview loop. */
	readonly priority: number;

	/** Return true if this adapter should handle the given target. */
	canHandle(target: ResponsiveTarget): boolean;

	/**
	 * Convert a responsive value into one or more CSS declarations.
	 * Receives the already-resolved channels so adapters can implement
	 * precedence logic (e.g. preset-slug skips when style-value is set).
	 */
	resolve(
		target: ResponsiveTarget,
		value: unknown,
		resolvedChannels: ResolvedChannels,
	): AdapterResolveResult;
}
