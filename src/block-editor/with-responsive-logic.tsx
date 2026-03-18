import React from "react";
import { createHigherOrderComponent } from "@wordpress/compose";
import { useEffect, useRef } from "@wordpress/element";
import { useSelect } from "@wordpress/data";
import { clone, isObject, getValueAtPath } from "../utils";
import { useActiveTargets } from "./targets-store";

import {
	getResponsiveValue,
	removeResponsiveValue,
	setResponsiveValue,
} from "./responsive-targets";

const setValueAtPath = (
	object: Record<string, any>,
	path: string,
	value: any,
): Record<string, any> => {
	if (!path) {
		return object;
	}
	const segments = path.split(".");
	let cursor: Record<string, any> = object;
	segments.forEach((segment: string, index: number) => {
		if (index === segments.length - 1) {
			if (isObject(cursor[segment]) && isObject(value)) {
				cursor[segment] = { ...cursor[segment], ...value };
			} else {
				cursor[segment] = value;
			}
			return;
		}
		if (!isObject(cursor[segment])) {
			cursor[segment] = {};
		}
		cursor = cursor[segment];
	});
	return object;
};

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

			/**
			 * Run only once onMount
			 */
			useEffect(() => {
				if (didMountRef.current) {
					return;
				}
				didMountRef.current = true;

				const nextAttributes = clone(attrsRef.current);
				let nextResponsiveStyles = clone(
					attrsRef.current?.responsiveStyles || {},
				);
				let needsUpdate = false;

				targets.forEach((target) => {
					const desktopValue = getResponsiveValue(
						{ responsiveStyles: nextResponsiveStyles },
						"desktop",
						target,
					);

					if (desktopValue === undefined) {
						const liveValue = getValueAtPath(attrsRef.current, target.path);
						if (liveValue !== undefined) {
							nextResponsiveStyles = setResponsiveValue(
								{ responsiveStyles: nextResponsiveStyles },
								"desktop",
								target,
								liveValue,
							);
							needsUpdate = true;
						}
						return;
					}

					setValueAtPath(nextAttributes, target.path, clone(desktopValue));
					needsUpdate = true;
				});

				if (needsUpdate) {
					nextAttributes.responsiveStyles = nextResponsiveStyles;
					isSyncingRef.current = true;
					setAttributes(nextAttributes);

					requestAnimationFrame(() => {
						isSyncingRef.current = false;
					});
				}
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

				let nextResponsiveStyles = clone(
					attrsRef.current?.responsiveStyles || {},
				);

				targets.forEach((target) => {
					const liveValue = getValueAtPath(attrsRef.current, target.path);

					if (liveValue === undefined) {
						nextResponsiveStyles = removeResponsiveValue(
							{ responsiveStyles: nextResponsiveStyles },
							previousDevice,
							target,
						);
						return;
					}

					nextResponsiveStyles = setResponsiveValue(
						{ responsiveStyles: nextResponsiveStyles },
						previousDevice,
						target,
						liveValue,
					);
				});

				const nextAttributes = clone(attrsRef.current);

				targets.forEach((target) => {
					const currentDeviceValue = getResponsiveValue(
						{ responsiveStyles: nextResponsiveStyles },
						device,
						target,
					);
					setValueAtPath(
						nextAttributes,
						target.path,
						currentDeviceValue === undefined
							? undefined
							: clone(currentDeviceValue),
					);
				});

				nextAttributes.responsiveStyles = nextResponsiveStyles;

				isSyncingRef.current = true;

				setAttributes(nextAttributes);
				requestAnimationFrame(() => {
					isSyncingRef.current = false;
					console.log("Screen changed: ", nextAttributes);
				});
			}, [device]); // eslint-disable-line react-hooks/exhaustive-deps

			/**
			 * Run Everytime an attribute changes.
			 */

			const interceptedSetAttributes = (newAttrs: Record<string, any>) => {
				console.log("interceptedSetAttributes 1");
				if (isSyncingRef.current) {
					setAttributes(newAttrs);
					return;
				}

				let nextResponsiveStyles = clone(
					attrsRef.current?.responsiveStyles || {},
				);
				let hasResponsiveChange = false;

				targets.forEach((target) => {
					console.log("interceptedSetAttributes 2", target);

					if (!hasPathInObject(newAttrs, target.path)) {
						return;
					}

					const incomingValue = getValueAtPath(newAttrs, target.path);
					const currentValue = getValueAtPath(attrsRef.current, target.path);
					if (incomingValue === undefined && currentValue === undefined) {
						return;
					}

					if (incomingValue === undefined) {
						hasResponsiveChange = true;
						nextResponsiveStyles = removeResponsiveValue(
							{ responsiveStyles: nextResponsiveStyles },
							device,
							target,
						);
						return;
					}

					if (JSON.stringify(incomingValue) === JSON.stringify(currentValue)) {
						return;
					}

					hasResponsiveChange = true;
					nextResponsiveStyles = setResponsiveValue(
						{ responsiveStyles: nextResponsiveStyles },
						device,
						target,
						incomingValue,
					);
				});

				if (!hasResponsiveChange) {
					setAttributes(newAttrs);
					return;
				}

				setAttributes({
					...newAttrs,
					responsiveStyles: nextResponsiveStyles,
				});
				requestAnimationFrame(() => {
					console.log("Attribute Changed", {
						...newAttrs,
						responsiveStyles: nextResponsiveStyles,
					});
				});
			};

			return <BlockEdit {...props} setAttributes={interceptedSetAttributes} />;
		};
	},
	"withResponsiveLogic",
);
