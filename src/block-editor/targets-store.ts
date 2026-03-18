import { useMemo } from "react";
import {
	createReduxStore,
	dispatch,
	register,
	select,
	useSelect,
} from "@wordpress/data";
import { ExtendedWindow, ResponsiveTarget } from "./types";
import { normalizeTargets } from "./target-discovery";

const runtimeSettings =
	(window as ExtendedWindow)?.responsiveOverridesSettings || {};

export const ACTIVE_TARGETS_STORE_NAME = "responsive-overrides/active-targets";

type ActiveTargetsState = {
	targets: ResponsiveTarget[];
};

const DEFAULT_ACTIVE_TARGETS_STATE: ActiveTargetsState = {
	targets: normalizeTargets(
		runtimeSettings?.config?.targets,
	) as ResponsiveTarget[],
};

const activeTargetsStore = createReduxStore(ACTIVE_TARGETS_STORE_NAME, {
	reducer(
		state: ActiveTargetsState = DEFAULT_ACTIVE_TARGETS_STATE,
		action: { type: string; rawTargets?: unknown[] },
	): ActiveTargetsState {
		switch (action.type) {
			case "SET_ACTIVE_TARGETS":
				return {
					...state,
					targets: normalizeTargets(action.rawTargets) as ResponsiveTarget[],
				};
			default:
				return state;
		}
	},
	actions: {
		setActiveTargets(rawTargets: unknown[]) {
			return {
				type: "SET_ACTIVE_TARGETS",
				rawTargets,
			};
		},
	},
	selectors: {
		getActiveTargets(state: ActiveTargetsState): ResponsiveTarget[] {
			return state.targets;
		},
	},
});

register(activeTargetsStore);

export const getActiveTargets = (): ResponsiveTarget[] => {
	return (
		((
			select(ACTIVE_TARGETS_STORE_NAME) as any
		)?.getActiveTargets?.() as ResponsiveTarget[]) || []
	);
};

export const setActiveTargets = (rawTargets: unknown[]) => {
	(dispatch(ACTIVE_TARGETS_STORE_NAME) as any).setActiveTargets(rawTargets);
	return getActiveTargets();
};

export const useActiveTargets = (blockName?: string): ResponsiveTarget[] => {
	const targets = useSelect(
		(selectRegistry) =>
			((
				selectRegistry(ACTIVE_TARGETS_STORE_NAME) as any
			)?.getActiveTargets?.() as ResponsiveTarget[]) || [],
		[],
	);

	return useMemo(() => {
		if (!blockName) {
			return targets;
		}

		return targets.filter(
			(target: ResponsiveTarget) => target.block === blockName,
		);
	}, [targets, blockName]);
};
