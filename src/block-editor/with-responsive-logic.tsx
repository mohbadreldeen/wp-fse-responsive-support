import React from "react";
import { createHigherOrderComponent } from "@wordpress/compose";
import { useEffect, useRef } from "@wordpress/element";
import { useSelect } from "@wordpress/data";
import { clone, encodePathKey, isObject, getValueAtPath } from "../utils";
import { getActiveTargets } from "./target-discovery";
import { ResponsiveTarget } from "./types";

const getTargetsForBlock = (blockName: string): ResponsiveTarget[] =>
	(getActiveTargets() as ResponsiveTarget[]).filter(
		(target: ResponsiveTarget) => target.block === blockName,
	);

type WriteNormalizationContext = {
	devicePayload: Record<string, any>;
	target: ResponsiveTarget;
};

interface ResponsiveWriteAdapter {
	readonly id: string;
	readonly priority: number;
	canHandle(target: ResponsiveTarget): boolean;
	normalize(context: WriteNormalizationContext): void;
}

class ResponsiveWriteAdapterRegistry {
	private readonly adapters: ResponsiveWriteAdapter[] = [];

	register(adapter: ResponsiveWriteAdapter): void {
		this.adapters.push(adapter);
		this.adapters.sort((a, b) => b.priority - a.priority);
	}

	resolve(target: ResponsiveTarget): ResponsiveWriteAdapter | undefined {
		return this.adapters.find((adapter) => adapter.canHandle(target));
	}
}

const COLOR_ALIAS_CONFLICTS: Record<string, string[]> = {
	"style.color.background": ["backgroundColor"],
	backgroundColor: ["style.color.background"],
	"style.color.text": ["textColor"],
	textColor: ["style.color.text"],
};

const colorAliasWriteAdapter: ResponsiveWriteAdapter = {
	id: "color-alias-write-adapter",
	priority: 100,
	canHandle(target: ResponsiveTarget) {
		return Object.prototype.hasOwnProperty.call(
			COLOR_ALIAS_CONFLICTS,
			target.path,
		);
	},
	normalize({ devicePayload, target }: WriteNormalizationContext) {
		const conflictingPaths = COLOR_ALIAS_CONFLICTS[target.path] || [];
		conflictingPaths.forEach((path) => {
			const key = encodePathKey(path);
			if (devicePayload[key] !== undefined) {
				delete devicePayload[key];
			}
		});
	},
};

const responsiveWriteAdapterRegistry = new ResponsiveWriteAdapterRegistry();
responsiveWriteAdapterRegistry.register(colorAliasWriteAdapter);

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

const setResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
	value: any,
): Record<string, any> => {
	const nextResponsiveStyles = clone(attributes?.responsiveStyles || {});
	if (!isObject(nextResponsiveStyles[device])) {
		nextResponsiveStyles[device] = {};
	}
	const pathKey = encodePathKey(target.path);
	if (target.valueKind === "object" && isObject(value)) {
		const existingValue = isObject(nextResponsiveStyles[device][pathKey])
			? nextResponsiveStyles[device][pathKey]
			: {};
		const nextValue = { ...existingValue };
		if (Array.isArray(target.leafKeys) && target.leafKeys.length) {
			target.leafKeys.forEach((key: string) => {
				if (Object.prototype.hasOwnProperty.call(value, key)) {
					nextValue[key] = clone(value[key]);
				}
			});
		} else {
			Object.assign(nextValue, clone(value));
		}
		nextResponsiveStyles[device][pathKey] = nextValue;
	} else {
		nextResponsiveStyles[device][pathKey] = clone(value);
	}

	// Delegate post-write normalization to adapters for easier extensibility.
	try {
		const adapter = responsiveWriteAdapterRegistry.resolve(target);
		if (adapter && isObject(nextResponsiveStyles[device])) {
			adapter.normalize({
				devicePayload: nextResponsiveStyles[device],
				target,
			});
		}
	} catch (e) {
		// Defensive: don't let this helper throw in edge cases.
	}

	return nextResponsiveStyles;
};

const removeResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
): Record<string, any> => {
	const nextResponsiveStyles = clone(attributes?.responsiveStyles || {});
	if (!isObject(nextResponsiveStyles[device])) {
		nextResponsiveStyles[device] = {};
	}

	const pathKey = encodePathKey(target.path);
	if (nextResponsiveStyles[device][pathKey] !== undefined) {
		delete nextResponsiveStyles[device][pathKey];
	}

	// Keep alias targets mutually exclusive even when one side is removed.
	try {
		const adapter = responsiveWriteAdapterRegistry.resolve(target);
		if (adapter && isObject(nextResponsiveStyles[device])) {
			adapter.normalize({
				devicePayload: nextResponsiveStyles[device],
				target,
			});
		}
	} catch (e) {
		// Defensive: don't let this helper throw in edge cases.
	}

	return nextResponsiveStyles;
};

const getResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
): any => {
	const payload = attributes?.responsiveStyles?.[device];
	if (!isObject(payload)) {
		return undefined;
	}
	const pathKey = encodePathKey(target.path);
	if (payload[pathKey] !== undefined) {
		return payload[pathKey];
	}
	return undefined;
};

export const withResponsiveLogic = createHigherOrderComponent(
	(BlockEdit: any) => {
		return (props: any) => {
			const targets = getTargetsForBlock(props.name);

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

			useEffect(() => {
				console.log("first");
				if (didMountRef.current) {
					return;
				}
				didMountRef.current = true;
				console.log("continue");
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
					console.log("nextAttributes", nextAttributes);
					requestAnimationFrame(() => {
						isSyncingRef.current = false;
					});
				}
			}, []);

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
					console.log("liveValue", liveValue);
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
				console.log("divce changes nextAttributes", nextAttributes);
				setAttributes(nextAttributes);
				requestAnimationFrame(() => {
					isSyncingRef.current = false;
				});
			}, [device]); // eslint-disable-line react-hooks/exhaustive-deps

			const interceptedSetAttributes = (newAttrs: Record<string, any>) => {
				if (isSyncingRef.current) {
					setAttributes(newAttrs);
					return;
				}

				let nextResponsiveStyles = clone(
					attrsRef.current?.responsiveStyles || {},
				);
				let hasResponsiveChange = false;

				targets.forEach((target) => {
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
				console.log("attribute changes nextResponsiveStyles", {
					...newAttrs,
					responsiveStyles: nextResponsiveStyles,
				});
				setAttributes({
					...newAttrs,
					responsiveStyles: nextResponsiveStyles,
				});
			};

			return <BlockEdit {...props} setAttributes={interceptedSetAttributes} />;
		};
	},
	"withResponsiveLogic",
);
