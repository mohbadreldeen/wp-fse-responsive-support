import { getColorTargetMeta } from "./color-utils";
import type { ResponsiveTarget } from "./types";

const COLOR_CHANNEL_STYLE_PATHS: Record<string, string> = {
	text: "style.color.text",
	background: "style.color.background",
	border: "style.border.color",
};

const getColorFamilyPaths = (target: ResponsiveTarget): string[] => {
	if (!target.channel || !target.mapper) {
		return [target.path];
	}

	const stylePath = COLOR_CHANNEL_STYLE_PATHS[target.channel];
	if (!stylePath) {
		return [target.path];
	}

	return Array.from(new Set<string>([stylePath, target.mapper]));
};

export const getSiblingAliasPath = (
	target: ResponsiveTarget,
): string | undefined => {
	const familyPaths = getColorFamilyPaths(target);
	return familyPaths.find((path) => path !== target.path);
};

const getTrackedTargetPriority = (target: ResponsiveTarget): number => {
	if (target.sourceKind === "preset-slug") {
		return 0;
	}

	if (target.sourceKind === "style-value") {
		return 2;
	}

	return 1;
};

export const expandTrackedTargets = (
	targets: ResponsiveTarget[],
): ResponsiveTarget[] => {
	const trackedTargets = new Map<string, ResponsiveTarget>();

	targets.forEach((target) => {
		trackedTargets.set(target.path, target);

		if (!target.channel || !target.mapper) {
			return;
		}

		getColorFamilyPaths(target).forEach((path) => {
			if (trackedTargets.has(path)) {
				return;
			}

			const colorMeta = getColorTargetMeta(path);
			trackedTargets.set(path, {
				...target,
				path,
				mapper: target.mapper,
				sourceKind: colorMeta.sourceKind,
				channel: colorMeta.channel,
			});
		});
	});

	return Array.from(trackedTargets.values()).sort(
		(left, right) =>
			getTrackedTargetPriority(left) - getTrackedTargetPriority(right),
	);
};
