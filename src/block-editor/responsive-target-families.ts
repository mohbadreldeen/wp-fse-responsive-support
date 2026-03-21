import { getColorAliasPath, getColorTargetMeta } from "./color-utils";
import type { ResponsiveTarget } from "./types";
import { getCssPropertyForPath } from "../utils";

const getColorFamilyPaths = (target: ResponsiveTarget): string[] => {
	const siblingAliasPath = getColorAliasPath(target.path);
	if (!siblingAliasPath) {
		return [target.path];
	}

	return Array.from(new Set<string>([target.path, siblingAliasPath]));
};

export const getSiblingAliasPath = (
	target: ResponsiveTarget,
): string | undefined => {
	return getColorAliasPath(target.path);
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

		if (!target.channel) {
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
				cssProperty: getCssPropertyForPath(path),
				styleStrategy: undefined,
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
