import { useState, useEffect, useMemo } from "react";
import * as editPost from "@wordpress/edit-post";
import { __ } from "@wordpress/i18n";
import { useSelect } from "@wordpress/data";
import {
	Modal,
	Button,
	SearchControl,
	CheckboxControl,
	Notice,
} from "@wordpress/components";
import apiFetch from "@wordpress/api-fetch";
import { listAttributeCandidates } from "./target-discovery";
import { getActiveTargets, setActiveTargets } from "./targets-store";
import type {
	ExtendedWindow,
	RuntimeSettings,
	SelectedMap,
	FeedbackState,
	ApiTargetsResponse,
	BlockType,
	DiscoverableBlock,
	ResponsiveTarget,
} from "./types";

const HeaderToolbarButton = (editPost as { PluginToolbarButton?: any })
	?.PluginToolbarButton;

const runtimeSettings: RuntimeSettings =
	(window as ExtendedWindow)?.responsiveOverridesSettings || {};

const buildSearchTerms = (
	block: DiscoverableBlock,
	attribute?: ResponsiveTarget,
): string[] => {
	const terms = [block.name, block.title];

	if (!attribute) {
		return terms.map((term) => term.toLowerCase());
	}

	terms.push(attribute.path);

	if (attribute.cssProperty) {
		terms.push(attribute.cssProperty);
	}

	if (attribute.styleStrategy) {
		terms.push(attribute.styleStrategy);
	}

	terms.push(`${block.name}/${attribute.path}`);

	if (attribute.cssProperty) {
		terms.push(`${block.name}/${attribute.cssProperty}`);
	}

	if (attribute.styleStrategy) {
		terms.push(`${block.name}/${attribute.styleStrategy}`);
	}

	return terms.map((term) => term.toLowerCase());
};

const matchesSearch = (
	block: DiscoverableBlock,
	term: string,
	attribute?: ResponsiveTarget,
): boolean =>
	buildSearchTerms(block, attribute).some((candidate) =>
		candidate.includes(term),
	);

export const ResponsiveTargetsModal = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedMap, setSelectedMap] = useState<SelectedMap>({});
	const [feedback, setFeedback] = useState<FeedbackState>(null);

	useEffect(() => {
		if (HeaderToolbarButton) {
			return undefined;
		}

		let buttonEl: HTMLButtonElement | null = null;
		let intervalId: number | null = null;

		const mountFallbackButton = () => {
			if (buttonEl && document.body.contains(buttonEl)) {
				return;
			}

			const headerSettings = document.querySelector(
				".editor-header .editor-header__settings",
			);
			if (!headerSettings) {
				return;
			}

			buttonEl = document.createElement("button");
			buttonEl.type = "button";
			buttonEl.className = "components-button is-secondary";
			buttonEl.textContent = __("Responsive", "responsive-overrides");
			buttonEl.style.marginLeft = "8px";
			buttonEl.setAttribute(
				"aria-label",
				__("Responsive Overrides", "responsive-overrides"),
			);
			buttonEl.addEventListener("click", () => setIsOpen(true));

			const previewDropdown = headerSettings.querySelector(
				".editor-post-preview-dropdown, .editor-preview-dropdown",
			);
			if (previewDropdown && previewDropdown.parentNode) {
				previewDropdown.parentNode.insertBefore(
					buttonEl,
					previewDropdown.nextSibling,
				);
			} else {
				headerSettings.appendChild(buttonEl);
			}
		};

		mountFallbackButton();
		intervalId = window.setInterval(mountFallbackButton, 1200);

		return () => {
			if (intervalId) {
				window.clearInterval(intervalId);
			}
			if (buttonEl && buttonEl.parentNode) {
				buttonEl.parentNode.removeChild(buttonEl);
			}
		};
	}, []);

	const blockTypes = (useSelect((select) => {
		return (select("core/blocks") as any)?.getBlockTypes?.() || [];
	}, []) || []) as BlockType[];

	const discovered = useMemo<DiscoverableBlock[]>(() => {
		return blockTypes
			.map((block: BlockType) => {
				const attrs = listAttributeCandidates(
					block.attributes || {},
				) as ResponsiveTarget[];
				return {
					name: block.name,
					title: block.title || block.name,
					attributes: attrs,
				};
			})
			.filter((block: DiscoverableBlock) => block.attributes.length > 0);
	}, [blockTypes]);

	useEffect(() => {
		const initial: SelectedMap = {};
		(getActiveTargets() as ResponsiveTarget[]).forEach(
			(target: ResponsiveTarget) => {
				const key = `${target.block}|${target.path}`;
				initial[key] = target;
			},
		);
		setSelectedMap(initial);
	}, [isOpen]);

	const filteredBlocks = useMemo<DiscoverableBlock[]>(() => {
		const term = search.trim().toLowerCase();
		if (!term) {
			return discovered;
		}

		return discovered
			.map((block: DiscoverableBlock) => {
				const matchesBlock = matchesSearch(block, term);
				if (matchesBlock) {
					return block;
				}

				const attrMatches = block.attributes.filter((attr: ResponsiveTarget) =>
					matchesSearch(block, term, attr),
				);
				if (!attrMatches.length) {
					return null;
				}

				return { ...block, attributes: attrMatches };
			})
			.filter((block): block is DiscoverableBlock => Boolean(block));
	}, [discovered, search]);

	const selectedCount = Object.keys(selectedMap).length;

	const toggleSelection = (block: any, attr: any, isChecked: boolean) => {
		const key = `${block.name}|${attr.path}`;
		setSelectedMap((current: SelectedMap) => {
			if (!isChecked) {
				const next = { ...current };
				delete next[key];
				return next;
			}

			return {
				...current,
				[key]: {
					block: block.name,
					path: attr.path,
					valueKind: attr.valueKind,
					leafKeys: attr.leafKeys || [],
					cssProperty: attr.cssProperty || "",
					styleStrategy: attr.styleStrategy,
					sourceKind: attr.sourceKind,
					channel: attr.channel,
				},
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
				path: runtimeSettings?.restPath || "/responsive-overrides/v1/targets",
				method: "POST",
				headers: {
					"X-WP-Nonce": runtimeSettings?.nonce || "",
				},
				data: payload,
			})) as ApiTargetsResponse;

			const nextTargets = setActiveTargets(
				response?.targets || [],
			) as ResponsiveTarget[];
			if (runtimeSettings?.config) {
				runtimeSettings.config.targets = nextTargets;
			}

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
									const key = `${block.name}|${attr.path}`;
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
