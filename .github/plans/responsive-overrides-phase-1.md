## Responsive Overrides Phase 1 - Current Implementation Status

This file captures what is already implemented in the plugin codebase for Phase 1.

### Scope Confirmed in Code
- Target block is hardcoded to `core/group`.
- Target responsive field is padding only (`top`, `right`, `bottom`, `left`).
- Responsive payload uses a namespaced attribute: `responsiveStyles`.
- Devices currently used: `desktop`, `tablet`, `mobile`.

### Implemented
1. Plugin metadata and minimum versions
- `responsive-overrides.php` includes plugin header and currently declares `Requires at least: 6.7` and `Requires PHP: 7.4`.

2. Editor script enqueue
- `enqueue_block_editor_assets` loads `build/themeplix-block-editor.js` using asset dependencies/version from `build/themeplix-block-editor.asset.php`.

3. Block attribute augmentation
- `block_type_metadata_settings` filter adds `responsiveStyles` attribute to `core/group` only.
- Default shape is object with device keys (`desktop/tablet/mobile`).

4. Editor interception and preview behavior
- `src/block-editor/index.js` uses `editor.BlockEdit` and `editor.BlockListBlock` filters.
- Interception only runs for `core/group`.
- On Desktop, padding edits are mirrored into `responsiveStyles.desktop.padding`.
- On Tablet/Mobile, padding edits are written into `responsiveStyles.{device}.padding`.
- Device switching persists previous device padding and loads current device padding into editing state.
- Non-target blocks are no-op.

5. Frontend render output
- `render_block` filter targets `core/group` and reads `attrs.responsiveStyles`.
- Generates per-instance class (`ro-rsp-{n}`) and inline `<style>` rules.
- Emits base rule (desktop if present) plus media queries for tablet/mobile.
- Breakpoints are centralized in `ro_get_responsive_breakpoints()` and filterable via `responsive_overrides_breakpoints`.

6. Value normalization/sanitization guardrails
- `ro_get_device_spacing_declarations()` accepts only known padding sides.
- Values are trimmed, preset tokens (`var:preset|...`) are converted to CSS custom property format, and values are restricted by regex.

7. Debug logging guardrail
- `ro_debug()` logs only when `WP_DEBUG` is enabled.

### Partially Implemented or Divergent From Original Plan
1. Attribute path divergence
- Original plan referenced `responsiveStyles.{device}.style.spacing.*`.
- Current code uses `responsiveStyles.{device}.padding.*`.

2. Desktop source-of-truth behavior
- Original plan expected core `style.spacing.*` as desktop source-of-truth.
- Current render filter can also emit a desktop CSS rule from `responsiveStyles.desktop.padding`, which can override inline styles.

3. Frontend style strategy
- Current strategy is inline style tags appended per rendered block instance (correct but not yet optimized).

### Not Yet Implemented From Plan
1. WordPress 6.7 registration fallback path
- No fallback logic exists for `wp_register_block_types_from_metadata_collection` because block collection registration is not currently used in this plugin bootstrap.

2. Automated verification and matrix testing
- No committed WP 6.7/6.8 verification matrix, lint/test automation, or explicit build-validation checklist in repo docs.

3. Phase 2 settings-driven dynamic targeting
- No settings option, no admin/editor UI for target selection, and no dynamic schema-driven interception/rendering yet.

### Files Audited
- `responsive-overrides.php`
- `src/block-editor/index.js`
- `build/themeplix-block-editor.asset.php` (indirectly referenced by enqueue)
