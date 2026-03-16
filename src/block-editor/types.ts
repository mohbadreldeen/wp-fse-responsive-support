type ValueKind = 'scalar' | 'object';

type ResponsiveTarget = {
	block: string;
	path: string;
	valueKind: ValueKind;
	leafKeys: string[];
	mapper: string;
};

type SelectedMap = Record<string, ResponsiveTarget>;

type FeedbackState = {
	status: 'success' | 'error';
	message: string;
} | null;

type RuntimeSettings = {
	restPath?: string;
	nonce?: string;
	config?: {
		targets?: unknown[];
	};
};

type ApiTargetsResponse = {
	targets?: unknown[];
};

type DiscoverableBlock = {
	name: string;
	title: string;
	attributes: ResponsiveTarget[];
};

type BlockType = {
	name: string;
	title?: string;
	attributes?: Record<string, unknown>;
};