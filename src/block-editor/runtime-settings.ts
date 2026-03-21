import type { ExtendedWindow, ResponsiveTarget, RuntimeSettings } from "./types";

export const DEFAULT_TARGETS_REST_PATH = "/responsive-overrides/v1/targets";

const runtimeSettings: RuntimeSettings =
	(window as ExtendedWindow)?.responsiveOverridesSettings || {};

export const getRuntimeSettings = (): RuntimeSettings => runtimeSettings;

export const getRuntimeTargets = (): unknown[] =>
	runtimeSettings?.config?.targets || [];

export const setRuntimeTargets = (targets: ResponsiveTarget[]): void => {
	if (!runtimeSettings.config) {
		runtimeSettings.config = {};
	}

	runtimeSettings.config.targets = targets;
};