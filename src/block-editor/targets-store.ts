import { useMemo } from "react";
import { createReduxStore, dispatch, register, useSelect } from "@wordpress/data";
import { ResponsiveTarget } from "./types";
import { normalizeTargets } from "./target-discovery";
import { getRuntimeTargets } from "./runtime-settings";

export const ACTIVE_TARGETS_STORE_NAME = "responsive-overrides/active-targets";
const SET_ACTIVE_TARGETS = "SET_ACTIVE_TARGETS";

type ActiveTargetsState = {
	targets: ResponsiveTarget[];
};

const DEFAULT_ACTIVE_TARGETS_STATE: ActiveTargetsState = {
	targets: normalizeTargets(getRuntimeTargets()) as ResponsiveTarget[],
};

const activeTargetsStore = createReduxStore(ACTIVE_TARGETS_STORE_NAME, {
	reducer(
		state: ActiveTargetsState = DEFAULT_ACTIVE_TARGETS_STATE,
		action: { type: string; rawTargets?: unknown[] },
	): ActiveTargetsState {
		switch (action.type) {
			case SET_ACTIVE_TARGETS:
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
				type: SET_ACTIVE_TARGETS,
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

let hasRegisteredActiveTargetsStore = false;

export const registerActiveTargetsStore = (): void => {
	if (hasRegisteredActiveTargetsStore) {
		return;
	}

	register(activeTargetsStore);
	hasRegisteredActiveTargetsStore = true;
};

export const setActiveTargets = (rawTargets: unknown[]): ResponsiveTarget[] => {
	(dispatch(ACTIVE_TARGETS_STORE_NAME) as any).setActiveTargets(rawTargets);
	return normalizeTargets(rawTargets) as ResponsiveTarget[];
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
