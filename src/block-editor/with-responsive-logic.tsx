import React from "react";
import { createHigherOrderComponent } from "@wordpress/compose";
import { useLayoutEffect, useRef, useEffect } from "@wordpress/element";
import { useSelect } from "@wordpress/data";
import { clone, isObject, getValueAtPath, setValueAtPath } from "../utils";
import { useActiveTargets } from "./targets-store";
import type { ResponsiveTarget } from "./types";
import { expandTrackedTargets } from "./responsive-target-families";

import {
	getResponsiveValue,
	getResponsiveValueWithFallback,
	removeResponsiveValue,
	setResponsiveValue,
} from "./responsive-targets";

const hasPathInObject = (
	object: Record<string, any>,
	path: string,
): boolean => {
	if (!isObject(object) || !path) {
		return false;
	}

	const segments = path.split(".");
	let cursor: any = object;

	for (let index = 0; index < segments.length; index += 1) {
		const segment = segments[index];
		if (
			!isObject(cursor) ||
			!Object.prototype.hasOwnProperty.call(cursor, segment)
		) {
			return false;
		}
		cursor = cursor[segment];
	}

	return true;
};

const cloneResponsiveStyles = (
	attributes: Record<string, any>,
): Record<string, any> => clone(attributes?.responsiveStyles || {});

const writeResponsiveValue = (
	responsiveStyles: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
	value: any,
): Record<string, any> => {
	if (value === undefined) {
		return removeResponsiveValue({ responsiveStyles }, device, target);
	}

	return setResponsiveValue({ responsiveStyles }, device, target, value);
};

const areValuesEqual = (left: any, right: any): boolean => {
	if (left === right) {
		return true;
	}

	return JSON.stringify(left) === JSON.stringify(right);
};

/**
 * Build a minimal setAttributes patch containing only top-level keys
 * whose values changed between the original and modified objects.
 * Keys explicitly set to undefined in modified are included so
 * Gutenberg can unset them.
 */
const buildTopLevelPatch = (
	original: Record<string, any>,
	modified: Record<string, any>,
): Record<string, any> => {
	const patch: Record<string, any> = {};

	for (const key of Object.keys(modified)) {
		if (!areValuesEqual(original[key], modified[key])) {
			patch[key] = modified[key];
		}
	}

	// Include keys that existed in original but are now undefined in modified.
	for (const key of Object.keys(original)) {
		if (modified[key] === undefined && original[key] !== undefined) {
			patch[key] = undefined;
		}
	}

	return patch;
};

const applyLiveAttributeValue = (
	attributes: Record<string, any>,
	path: string,
	value: any,
): Record<string, any> => {
	return setValueAtPath(attributes, path, value);
};

const hasPatchChanges = (patch: Record<string, any>): boolean => {
	return Object.keys(patch).length > 0;
};

const buildMountSyncAttributes = (
	attributes: Record<string, any>,
	targets: ResponsiveTarget[],
): Record<string, any> | null => {
	const nextAttributes = clone(attributes);
	let nextResponsiveStyles = cloneResponsiveStyles(attributes);
	let needsUpdate = false;

	targets.forEach((target) => {
		const desktopValue = getResponsiveValue(
			{ responsiveStyles: nextResponsiveStyles },
			"desktop",
			target,
		);

		if (desktopValue === undefined) {
			const liveValue = getValueAtPath(attributes, target.path);
			if (liveValue === undefined) {
				return;
			}

			nextResponsiveStyles = writeResponsiveValue(
				nextResponsiveStyles,
				"desktop",
				target,
				liveValue,
			);
			needsUpdate = true;
			return;
		}

		setValueAtPath(nextAttributes, target.path, clone(desktopValue));
		needsUpdate = true;
	});

	if (!needsUpdate) {
		return null;
	}

	nextAttributes.responsiveStyles = nextResponsiveStyles;
	return buildTopLevelPatch(attributes, nextAttributes);
};

const buildDeviceSyncAttributes = (
	attributes: Record<string, any>,
	targets: ResponsiveTarget[],
	previousDevice: string,
	device: string,
): Record<string, any> => {
	let nextResponsiveStyles = cloneResponsiveStyles(attributes);

	targets.forEach((target) => {
		const liveValue = getValueAtPath(attributes, target.path);
		const explicitPreviousValue = getResponsiveValue(
			{ responsiveStyles: nextResponsiveStyles },
			previousDevice,
			target,
		);
		const inheritedPreviousValue = getResponsiveValueWithFallback(
			{ responsiveStyles: nextResponsiveStyles },
			previousDevice,
			target,
			false,
		);

		const shouldRemoveInheritedWrite =
			explicitPreviousValue === undefined &&
			areValuesEqual(liveValue, inheritedPreviousValue);

		const valueToStore = shouldRemoveInheritedWrite ? undefined : liveValue;
		nextResponsiveStyles = writeResponsiveValue(
			nextResponsiveStyles,
			previousDevice,
			target,
			valueToStore,
		);
	});

	const nextAttributes = clone(attributes);

	targets.forEach((target) => {
		const currentDeviceValue = getResponsiveValueWithFallback(
			{ responsiveStyles: nextResponsiveStyles },
			device,
			target,
		);
		const normalizedCurrentDeviceValue =
			currentDeviceValue === undefined ? undefined : clone(currentDeviceValue);

		applyLiveAttributeValue(
			nextAttributes,
			target.path,
			normalizedCurrentDeviceValue,
		);
	});

	nextAttributes.responsiveStyles = nextResponsiveStyles;
	return buildTopLevelPatch(attributes, nextAttributes);
};

const buildResponsiveAttributeUpdate = (
	attributes: Record<string, any>,
	newAttrs: Record<string, any>,
	device: string,
	targets: ResponsiveTarget[],
): Record<string, any> | null => {
	let nextResponsiveStyles = cloneResponsiveStyles(attributes);
	let hasResponsiveChange = false;

	targets.forEach((target) => {
		if (!hasPathInObject(newAttrs, target.path)) {
			return;
		}

		const incomingValue = getValueAtPath(newAttrs, target.path);
		const currentValue = getValueAtPath(attributes, target.path);

		if (incomingValue === undefined && currentValue === undefined) {
			return;
		}

		if (incomingValue === undefined) {
			hasResponsiveChange = true;
			nextResponsiveStyles = writeResponsiveValue(
				nextResponsiveStyles,
				device,
				target,
				incomingValue,
			);
			return;
		}

		if (areValuesEqual(incomingValue, currentValue)) {
			return;
		}

		hasResponsiveChange = true;
		nextResponsiveStyles = writeResponsiveValue(
			nextResponsiveStyles,
			device,
			target,
			incomingValue,
		);
	});

	if (!hasResponsiveChange) {
		return null;
	}

	return {
		...newAttrs,
		responsiveStyles: nextResponsiveStyles,
	};
};

export const __withResponsiveLogicTestUtils = {
	buildDeviceSyncAttributes,
	buildResponsiveAttributeUpdate,
};

const scheduleSyncReset = (syncRef: { current: boolean }) => {
	requestAnimationFrame(() => {
		syncRef.current = false;
	});
};

export const withResponsiveLogic = createHigherOrderComponent(
	(BlockEdit: any) => {
		return (props: any) => {
			const activeTargets = useActiveTargets(props.name);
			const targets = expandTrackedTargets(activeTargets);

			if (!targets.length) {
				return <BlockEdit {...props} />;
			}

			const { setAttributes, attributes } = props;
			const deviceType = useSelect(
				(select) =>
					(select("core/editor") as any).getDeviceType?.() || "Desktop",
				[],
			);
			const device = ((deviceType as string) || "Desktop").toLowerCase();
			const prevDeviceRef = useRef(device);
			const isSyncingRef = useRef(false);
			const attrsRef = useRef(attributes);
			const didMountRef = useRef(false);
			attrsRef.current = attributes;

			const applySyncedAttributes = (patch: Record<string, any>) => {
				if (!hasPatchChanges(patch)) {
					return;
				}

				isSyncingRef.current = true;
				attrsRef.current = { ...attrsRef.current, ...patch };
				setAttributes(patch);
				scheduleSyncReset(isSyncingRef);
			};

			/**
			 * Run only once onMount
			 */
			useEffect(() => {
				if (didMountRef.current) {
					return;
				}
				didMountRef.current = true;

				const nextAttributes = buildMountSyncAttributes(
					attrsRef.current,
					targets,
				);

				if (!nextAttributes) {
					return;
				}

				applySyncedAttributes(nextAttributes);
			}, []);
			/**
			 * Run after every device preview change
			 */
			useEffect(() => {
				if (prevDeviceRef.current === device) {
					return;
				}

				const previousDevice = prevDeviceRef.current;
				prevDeviceRef.current = device;

				const nextAttributes = buildDeviceSyncAttributes(
					attrsRef.current,
					targets,
					previousDevice,
					device,
				);

				if (!hasPatchChanges(nextAttributes)) {
					return;
				}

				requestAnimationFrame(() => {
					applySyncedAttributes(nextAttributes);
				});
			}, [device]); // eslint-disable-line react-hooks/exhaustive-deps

			/**
			 * Run every time an attribute changes.
			 */

			const interceptedSetAttributes = (newAttrs: Record<string, any>) => {
				if (isSyncingRef.current) {
					setAttributes(newAttrs);
					return;
				}

				const nextAttributes = buildResponsiveAttributeUpdate(
					attrsRef.current,
					newAttrs,
					device,
					targets,
				);

				if (!nextAttributes) {
					setAttributes(newAttrs);
					return;
				}

				setAttributes(nextAttributes);
			};

			return <BlockEdit {...props} setAttributes={interceptedSetAttributes} />;
		};
	},
	"withResponsiveLogic",
);
