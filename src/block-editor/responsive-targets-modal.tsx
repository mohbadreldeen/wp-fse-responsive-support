import { useState, useEffect, useRef } from "react";
import * as editPost from "@wordpress/edit-post";
import { __ } from "@wordpress/i18n";
import {
	Modal,
	Button,
	SearchControl,
	CheckboxControl,
	Notice,
} from "@wordpress/components";
import apiFetch from "@wordpress/api-fetch";
import { useFilteredDiscoverableBlocks } from "./discoverable-blocks";
import { setActiveTargets, useActiveTargets } from "./targets-store";
import {
	DEFAULT_TARGETS_REST_PATH,
	getRuntimeSettings,
	setRuntimeTargets,
} from "./runtime-settings";
import type {
	SelectedMap,
	FeedbackState,
	ApiTargetsResponse,
	DiscoverableBlock,
	ResponsiveTarget,
} from "./types";

const HeaderToolbarButton = (editPost as { PluginToolbarButton?: any })
	?.PluginToolbarButton;

const FALLBACK_TOOLBAR_HOST_SELECTOR = ".editor-header .editor-header__settings";
const FALLBACK_TOOLBAR_ANCHOR_SELECTOR =
	".editor-post-preview-dropdown, .editor-preview-dropdown";

const mountFallbackToolbarButton = (buttonEl: HTMLButtonElement): boolean => {
	const headerSettings = document.querySelector(
		FALLBACK_TOOLBAR_HOST_SELECTOR,
	);
	if (!headerSettings) {
		return false;
	}

	if (document.body.contains(buttonEl)) {
		return true;
	}

	const previewDropdown = headerSettings.querySelector(
		FALLBACK_TOOLBAR_ANCHOR_SELECTOR,
	);
	if (previewDropdown?.parentNode) {
		previewDropdown.parentNode.insertBefore(buttonEl, previewDropdown.nextSibling);
		return true;
	}

	headerSettings.appendChild(buttonEl);
	return true;
};

const createFallbackToolbarButton = (
	onOpen: () => void,
): { button: HTMLButtonElement; cleanup: () => void } => {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "components-button is-secondary";
	button.textContent = __("Responsive", "responsive-overrides");
	button.style.marginLeft = "8px";
	button.setAttribute(
		"aria-label",
		__("Responsive Overrides", "responsive-overrides"),
	);
	button.addEventListener("click", onOpen);

	return {
		button,
		cleanup: () => {
			button.removeEventListener("click", onOpen);
			button.remove();
		},
	};
};

const useFallbackToolbarButton = (enabled: boolean, onOpen: () => void): void => {
	const onOpenRef = useRef(onOpen);
	onOpenRef.current = onOpen;

	useEffect(() => {
		if (!enabled || typeof document === "undefined") {
			return undefined;
		}

		const { button, cleanup } = createFallbackToolbarButton(() => {
			onOpenRef.current();
		});
		const ensureButtonMounted = () => {
			mountFallbackToolbarButton(button);
		};

		ensureButtonMounted();

		if (typeof MutationObserver === "undefined") {
			return cleanup;
		}

		const observer = new MutationObserver(() => {
			ensureButtonMounted();
		});

		const observerTarget = document.body || document.documentElement;
		if (observerTarget) {
			observer.observe(observerTarget, {
				childList: true,
				subtree: true,
			});
		}

		return () => {
			observer.disconnect();
			cleanup();
		};
	}, [enabled]);
};

const buildSelectionKey = (blockName: string, path: string): string =>
	`${blockName}|${path}`;

const buildSelectedMap = (targets: ResponsiveTarget[]): SelectedMap => {
	const selected: SelectedMap = {};
	targets.forEach((target) => {
		selected[buildSelectionKey(target.block, target.path)] = target;
	});
	return selected;
};

const toSelectedTarget = (
	blockName: string,
	attribute: ResponsiveTarget,
): ResponsiveTarget => ({
	block: blockName,
	path: attribute.path,
	valueKind: attribute.valueKind,
	leafKeys: attribute.leafKeys || [],
	cssProperty: attribute.cssProperty || "",
	styleStrategy: attribute.styleStrategy,
	sourceKind: attribute.sourceKind,
	channel: attribute.channel,
});

export const ResponsiveTargetsModal = () => {
	const runtimeSettings = getRuntimeSettings();
	const activeTargets = useActiveTargets();
	const [isOpen, setIsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedMap, setSelectedMap] = useState<SelectedMap>({});
	const [feedback, setFeedback] = useState<FeedbackState>(null);
 	const filteredBlocks = useFilteredDiscoverableBlocks(search);

	useFallbackToolbarButton(!HeaderToolbarButton, () => setIsOpen(true));

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		setSelectedMap(buildSelectedMap(activeTargets));
		setSearch("");
		setFeedback(null);
	}, [activeTargets, isOpen]);

	const selectedCount = Object.keys(selectedMap).length;

	const toggleSelection = (
		block: DiscoverableBlock,
		attr: ResponsiveTarget,
		isChecked: boolean,
	) => {
		const key = buildSelectionKey(block.name, attr.path);
		setSelectedMap((current: SelectedMap) => {
			if (!isChecked) {
				const next = { ...current };
				delete next[key];
				return next;
			}

			return {
				...current,
				[key]: toSelectedTarget(block.name, attr),
			};
		});
	};

	const saveTargets = async () => {
		setIsSaving(true);
		setFeedback(null);

		const payload = {
			targets: Object.values(selectedMap),
		};

		try {
			const response = (await apiFetch({
				path: runtimeSettings?.restPath || DEFAULT_TARGETS_REST_PATH,
				method: "POST",
				headers: {
					"X-WP-Nonce": runtimeSettings?.nonce || "",
				},
				data: payload,
			})) as ApiTargetsResponse;

			const nextTargets = setActiveTargets(
				response?.targets || [],
			) as ResponsiveTarget[];
			setRuntimeTargets(nextTargets);

			setFeedback({
				status: "success",
				message: __("Responsive targets saved.", "responsive-overrides"),
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: __("Failed to save responsive targets.", "responsive-overrides");

			setFeedback({
				status: "error",
				message: errorMessage,
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<>
			{HeaderToolbarButton ? (
				<HeaderToolbarButton
					icon="smartphone"
					label={__("Responsive Overrides", "responsive-overrides")}
					onClick={() => setIsOpen(true)}
				/>
			) : null}
			{isOpen && (
				<Modal
					title={__("Responsive Target Settings", "responsive-overrides")}
					onRequestClose={() => setIsOpen(false)}
				>
					<SearchControl
						label={__("Filter blocks or attributes", "responsive-overrides")}
						value={search}
						onChange={setSearch}
					/>
					<p>
						{__(
							"Select block attributes to make responsive per device.",
							"responsive-overrides",
						)}
					</p>
					<p>{`${selectedCount} ${__(
						"attributes selected",
						"responsive-overrides",
					)}`}</p>
					<div
						style={{
							maxHeight: "50vh",
							overflow: "auto",
							border: "1px solid #ddd",
							padding: "8px",
						}}
					>
						{filteredBlocks.map((block: DiscoverableBlock) => (
							<div key={block.name} style={{ marginBottom: "16px" }}>
								<strong>{block.title}</strong>
								<code style={{ display: "block", marginBottom: "6px" }}>
									{block.name}
								</code>
								{block.attributes.map((attr: ResponsiveTarget) => {
									const key = buildSelectionKey(block.name, attr.path);
									return (
										<CheckboxControl
											key={key}
											label={`${attr.path} (${attr.valueKind})`}
											checked={Boolean(selectedMap[key])}
											onChange={(isChecked) =>
												toggleSelection(block, attr, isChecked)
											}
										/>
									);
								})}
							</div>
						))}
					</div>

					{feedback && (
						<Notice status={feedback.status} isDismissible={false}>
							{feedback.message}
						</Notice>
					)}

					<div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
						<Button
							variant="primary"
							onClick={saveTargets}
							isBusy={isSaving}
							disabled={isSaving}
						>
							{__("Save Targets", "responsive-overrides")}
						</Button>
						<Button variant="secondary" onClick={() => setIsOpen(false)}>
							{__("Close", "responsive-overrides")}
						</Button>
					</div>
				</Modal>
			)}
		</>
	);
};
