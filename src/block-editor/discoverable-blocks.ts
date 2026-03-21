import { useMemo } from "react";
import { useSelect } from "@wordpress/data";
import { listAttributeCandidates } from "./target-discovery";
import type {
	BlockType,
	DiscoverableBlock,
	ResponsiveTarget,
} from "./types";

const getSearchTerms = (
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
	searchTerm: string,
	attribute?: ResponsiveTarget,
): boolean =>
	getSearchTerms(block, attribute).some((candidate) =>
		candidate.includes(searchTerm),
	);

export const buildDiscoverableBlocks = (
	blockTypes: BlockType[],
): DiscoverableBlock[] => {
	return blockTypes
		.map((block) => ({
			name: block.name,
			title: block.title || block.name,
			attributes: listAttributeCandidates(
				block.attributes || {},
			) as ResponsiveTarget[],
		}))
		.filter((block) => block.attributes.length > 0);
};

export const filterDiscoverableBlocks = (
	blocks: DiscoverableBlock[],
	search: string,
): DiscoverableBlock[] => {
	const normalizedSearch = search.trim().toLowerCase();
	if (!normalizedSearch) {
		return blocks;
	}

	return blocks
		.map((block) => {
			if (matchesSearch(block, normalizedSearch)) {
				return block;
			}

			const matchingAttributes = block.attributes.filter((attribute) =>
				matchesSearch(block, normalizedSearch, attribute),
			);

			if (!matchingAttributes.length) {
				return null;
			}

			return {
				...block,
				attributes: matchingAttributes,
			};
		})
		.filter((block): block is DiscoverableBlock => Boolean(block));
};

export const useDiscoverableBlocks = (): DiscoverableBlock[] => {
	const blockTypes = (useSelect((select) => {
		return (select("core/blocks") as any)?.getBlockTypes?.() || [];
	}, []) || []) as BlockType[];

	return useMemo(() => buildDiscoverableBlocks(blockTypes), [blockTypes]);
};

export const useFilteredDiscoverableBlocks = (
	search: string,
): DiscoverableBlock[] => {
	const discoverableBlocks = useDiscoverableBlocks();

	return useMemo(
		() => filterDiscoverableBlocks(discoverableBlocks, search),
		[discoverableBlocks, search],
	);
};