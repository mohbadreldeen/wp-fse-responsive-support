## Plan: Responsive Group Spacing Phase 1-2

Implement Phase 1 by extending `core/group` with a compatibility-safe `responsiveStyles` attribute model (not mutating core spacing schema), intercepting editor updates for selected spacing fields, and outputting responsive frontend CSS through `render_block` so behavior matches editor + frontend on WordPress 6.7+. Phase 2 then adds a settings UI to choose block/attribute targets and reuses the same integration pipeline dynamically.

**Steps**
1. Phase A - Foundation and compatibility
2. Update plugin bootstrap in `responsive-overrides.php` to support WordPress 6.7+ by adding a fallback registration path when `wp_register_block_types_from_metadata_collection` is unavailable; lower plugin requirement metadata accordingly. 
3. Restrict attribute augmentation logic to `core/group` for Phase 1 and inject only a namespaced responsive payload attribute (for example `responsiveStyles`) with a stable shape for `desktop/tablet/mobile`. 
4. Add guardrails around debug logging and remove always-on metadata logging to avoid performance/noise in production.
5. Phase B - Editor integration for spacing capture
6. Activate `editor.BlockEdit` interception in `src/block-editor/index.js` and scope it to `core/group`.
7. Implement targeted interception for only `style.spacing.paddingTop`, `style.spacing.paddingRight`, `style.spacing.paddingBottom`, and `style.spacing.paddingLeft`: on Desktop, write normal core values; on Tablet/Mobile, write into `responsiveStyles.{device}.style.spacing.*` while preserving existing object keys.
8. Activate/adjust `editor.BlockListBlock` preview logic so Tablet/Mobile device preview uses responsive spacing values from `responsiveStyles` without mutating saved Desktop values.
9. Ensure editor-side logic remains no-op for unsupported blocks and for unrelated attributes to avoid regressions.
10. Phase C - Frontend rendering and CSS output
11. Add a `render_block` filter in `responsive-overrides.php` (or dedicated include) that targets `core/group`, reads `responsiveStyles`, and emits deterministic responsive CSS selectors for tablet/mobile breakpoints.
12. Attach a unique class or data attribute per rendered block instance so generated CSS applies only to that block instance.
13. Normalize and sanitize spacing values before output (allowed units/value formats), skip invalid entries, and escape all output.
14. Keep Desktop source-of-truth in core `style.spacing.*` and only output media-query overrides for Tablet/Mobile.
15. Phase D - Packaging, testing, and verification
16. Rebuild assets (`themeplix-block-editor.js` and block assets), verify no missing dependencies, and confirm load order in editor.
17. Validate behavior manually in editor and frontend: Desktop/Tablet/Mobile switching updates expected values; saved content reopens correctly; frontend CSS matches editor preview.
18. Run PHP and JS lint/syntax checks and smoke-test against WordPress 6.7 and 6.8 to confirm fallback path and filter behavior.
19. Phase E - Phase 2 design extension (settings-driven targeting)
20. Add plugin settings storage (option) for selected block/attribute targets, starting with a controlled schema that maps block name -> responsive attribute paths.
21. Build admin UI for selecting blocks/attributes; validate input and persist to option.
22. Refactor Phase 1 integration points (attribute injection, editor interception, render CSS) to read from settings config rather than hardcoded `core/group` + padding fields.
23. Preserve safe defaults when no configuration exists (Phase 1 defaults), and add migration/versioning for future schema changes.

**Relevant files**
- `f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/responsive-overrides.php` - registration compatibility, metadata filter scoping, render filter wiring, plugin requirements alignment.
- `f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/block-editor/index.js` - editor interception and preview logic for responsive spacing.
- `f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/responsive-overrides/render.php` - optional helper extraction for render-time class/data generation if block render remains used.
- `f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/responsive-overrides/view.js` - likely minimal/no-op in Phase 1 due to server-rendered strategy; keep for optional enhancements.
- `f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/src/responsive-overrides/block.json` - confirm script/style handles and render integration metadata.
- `f:/host/www/gutenberg/wp-content/plugins/responsive-overrides/build/blocks-manifest.php` - verify generated registration mapping after rebuild (generated file, not hand-edited).

**Verification**
1. In WP 6.7 and WP 6.8 test sites, activate plugin and confirm no fatal errors during `init` block registration.
2. Insert `core/group`, set Desktop padding values, switch to Tablet/Mobile in editor preview, set different paddings, save, reload editor, verify values persist per device.
3. Inspect saved block attributes to confirm Desktop values remain in core spacing fields and responsive values persist under `responsiveStyles` only.
4. View frontend HTML/CSS and confirm media queries apply only to intended block instances and only for configured responsive fields.
5. Regression check: non-`core/group` blocks remain unaffected in editor behavior and frontend output.
6. Run project build/lint commands and confirm generated asset files load without dependency/version mismatches.

**Decisions**
- Use `responsiveStyles` as compatibility layer; do not mutate core block attribute schema types.
- Phase 1 scope includes only `core/group` and `paddingTop/paddingRight/paddingBottom/paddingLeft`.
- Frontend delivery uses server-side CSS generation via `render_block` filter (no JS dependency required).
- Explicitly support WordPress 6.7+ with fallback registration path.
- Excluded from Phase 1: margins, multi-block support, user-configurable target selection UI.

**Further Considerations**
1. Breakpoint constants: align with Gutenberg preview assumptions (e.g., tablet/mobile thresholds) and centralize them for editor/frontend consistency.
2. CSS output strategy: inline per-block style tags vs aggregated handle-level CSS buffer; start inline for correctness, optimize later if needed.
3. Phase 2 settings UX: decide whether settings live in wp-admin options page only, or also as in-editor plugin sidebar for faster workflows.
