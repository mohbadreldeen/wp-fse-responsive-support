import type { PreviewAdapter, ResponsiveTarget } from "./types";

/**
 * Registry that maps target paths to preview adapters.
 *
 * Resolution order:
 *   1. Exact-path registered adapters (highest determinism).
 *   2. Catch-all adapters registered with `registerFallback()`.
 * Within each tier adapters are sorted descending by `priority`.
 */
export class PreviewAdapterRegistry {
	private readonly pathMap = new Map<string, PreviewAdapter[]>();
	private readonly fallbacks: PreviewAdapter[] = [];

	register(path: string, adapter: PreviewAdapter): void {
		const existing = this.pathMap.get(path) ?? [];
		existing.push(adapter);
		existing.sort((a, b) => b.priority - a.priority);
		this.pathMap.set(path, existing);
	}

	registerFallback(adapter: PreviewAdapter): void {
		this.fallbacks.push(adapter);
		this.fallbacks.sort((a, b) => b.priority - a.priority);
	}

	/**
	 * Return the first adapter that can handle the given target.
	 * Prefers path-specific adapters over fallbacks.
	 */
	resolve(target: ResponsiveTarget): PreviewAdapter | undefined {
		const pathAdapters = this.pathMap.get(target.path) ?? [];
		const candidate =
			pathAdapters.find((a) => a.canHandle(target)) ??
			this.fallbacks.find((a) => a.canHandle(target));
		return candidate;
	}
}

export const previewAdapterRegistry = new PreviewAdapterRegistry();
