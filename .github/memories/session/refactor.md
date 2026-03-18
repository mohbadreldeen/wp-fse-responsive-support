## Plan: Path Adapter Preview Refactor

Adopt a path-first adapter registry in with-responsive-preview so each target path resolves through a dedicated adapter strategy instead of a growing conditional chain. This keeps behavior parity while making new path handling additive, testable, and isolated. Start with strict parity and only then remove legacy branches.

**Steps**

1. Phase 1 - Foundations
1. Define adapter contracts in types and create a registry module that can register and resolve adapters by exact path (with optional pattern support).
1. Add a small preview context object for adapter execution state, including per-channel applied source tracking for precedence control.
1. Keep existing preview logic untouched in this phase to eliminate behavior risk.

1. Phase 2 - Built-in adapters
1. Implement scalar color adapters:

- style color value adapter for style.color.text and style.color.background
- preset slug adapter for textColor and backgroundColor

2. Implement object adapters:

- spacing adapter for style.spacing.padding and style.spacing.margin
- border geometry adapter for style.border.radius and style.border.width

3. Implement generic fallback adapter for unmapped scalar paths using existing path-to-css conversion behavior.
4. Mirror current logic exactly, including slug normalization and invalid value guards.

5. Phase 3 - Integrate registry in preview loop
6. Replace mapper if/else branching in with-responsive-preview with registry resolution and first-matching-adapter execution.
7. Use adapter context to enforce color precedence:

- style-value wins over preset-slug for the same channel
- preset-slug skips when channel already resolved by style-value

3. Keep old helper functions temporarily behind compatibility wrappers for parity checks.

4. Phase 4 - Consolidation
5. Remove duplicated color meta inference from with-responsive-preview once adapters own that logic.
6. Deduplicate shared color metadata helpers between target-discovery and preview by extracting one shared utility.
7. Remove now-unused legacy conditional branches and helper functions.

8. Phase 5 - Verification and hardening
9. Add unit tests for each adapter resolve behavior, including skip/precedence outcomes.
10. Add integration-level tests for mixed targets where both style and preset paths are selected.
11. Validate no desktop preview mutation, and verify tablet/mobile still render expected styles.

**Relevant files**

- f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/block-editor/with-responsive-preview.ts — replace conditional dispatch with adapter registry execution; keep temporary compatibility wrappers during migration.
- f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/block-editor/types.ts — add adapter contracts and preview execution context types.
- f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/block-editor/target-discovery.ts — optionally move shared color metadata classification to a single reusable utility.
- f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/utils/index.ts — reuse existing normalization and css conversion helpers from adapters.
- f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/block-editor/preview-adapters/\* (new) — concrete adapter implementations.
- f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/block-editor/preview-adapter-registry.ts (new) — registry and adapter resolution.

**Verification**

1. Static checks: run TypeScript/ESLint diagnostics and ensure no new errors.
2. Behavior parity checks on sample targets:

- style.spacing.padding and style.spacing.margin object expansion
- style.border.radius and style.border.width expansion
- style.color.background/text scalar application
- backgroundColor/textColor preset slug resolution

3. Conflict checks:

- same channel with both style-value and preset-slug selected applies style-value output.

4. Device checks:

- desktop remains no-preview path
- tablet/mobile preview styles still apply.

5. Regression checks:

- unknown scalar path still maps with existing generic css conversion behavior.

**Decisions**

- Included scope: preview dispatch architecture, path-specific adapter strategies, precedence enforcement, and test coverage for parity.
- Excluded scope: changing storage schema of responsiveStyles, changing modal UX labels, or changing REST payload format.
- Migration principle: parity first, cleanup second.

**Further Considerations**

1. Registry matching policy recommendation:
   Option A exact-path only first for deterministic behavior and lower risk.
   Option B exact plus pattern support now for future flexibility.
   Recommended: Option A in first implementation, add patterns later if needed.
2. Adapter ordering recommendation:
   Use explicit priority per adapter rather than registration order to avoid subtle precedence bugs.
3. Shared metadata recommendation:
   Centralize color path classification in one utility to prevent drift between discovery and preview.
