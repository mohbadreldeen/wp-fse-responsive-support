import React from "react";
import { createHigherOrderComponent } from "@wordpress/compose";
import { useEffect, useRef } from "@wordpress/element";
import { useSelect } from "@wordpress/data";
import { clone, isObject, getValueAtPath, setValueAtPath } from "../utils";
import { useActiveTargets } from "./targets-store";
import type { ResponsiveTarget } from "./types";

import {
	getResponsiveValue,
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
	return nextAttributes;
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
		nextResponsiveStyles = writeResponsiveValue(
			nextResponsiveStyles,
			previousDevice,
			target,
			liveValue,
		);
	});

	const nextAttributes = clone(attributes);

	targets.forEach((target) => {
		const currentDeviceValue = getResponsiveValue(
			{ responsiveStyles: nextResponsiveStyles },
			device,
			target,
		);

		setValueAtPath(
			nextAttributes,
			target.path,
			currentDeviceValue === undefined ? undefined : clone(currentDeviceValue),
		);
	});

	nextAttributes.responsiveStyles = nextResponsiveStyles;
	return nextAttributes;
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

const scheduleSyncReset = (syncRef: { current: boolean }) => {
	requestAnimationFrame(() => {
		syncRef.current = false;
	});
};

export const withResponsiveLogic = createHigherOrderComponent(
	(BlockEdit: any) => {
		return (props: any) => {
			const targets = useActiveTargets(props.name);

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

			const applySyncedAttributes = (nextAttributes: Record<string, any>) => {
				isSyncingRef.current = true;
				setAttributes(nextAttributes);
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

				applySyncedAttributes(nextAttributes);
			}, [device]); // eslint-disable-line react-hooks/exhaustive-deps

			/**
			 * Run Everytime an attribute changes.
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
