## Responsive Overrides Phase 2 Plan

Goal: move from hardcoded `core/group` + `spacing.padding` behavior to a generic, settings-driven responsive system, with an editor-header control that opens a selector popup listing blocks and attributes.

### Product Requirements
1. Add an editor-header button that opens a popup/modal.
2. Popup must list blocks and their attributes and let users select:
- which block(s) should support responsive overrides
- which attribute(s) of those block(s) should be responsive
3. Only explicitly selected attributes will have responsive behavior (no defaults).
4. Generalize to mixed attribute shapes:
- scalar/text values (example: color or text-like values)
- object values (example: spacing object)

### Architecture Decisions
1. Configuration model (single source of truth)
- Store target config in a plugin option, for example `responsive_overrides_targets_v1`.
- Option structure (normalized) should define:
- block name
- attribute path (dot notation)
- value kind (`scalar` or `object`)
- optional object leaf map for known nested fields
- optional sanitizer/validator key

2. Runtime responsive data model
- Keep a namespaced `responsiveStyles` payload on target blocks.
- Normalize responsive values by path:
- `responsiveStyles.desktop[pathKey]`
- `responsiveStyles.tablet[pathKey]`
- `responsiveStyles.mobile[pathKey]`
- Use a deterministic encoded `pathKey` (safe for object keys).

3. Generic path utilities
- Implement shared get/set helpers for deep attribute paths in editor code.
- Helpers must safely handle missing objects, nulls, and non-object collisions.

4. Registration and fallback behavior
- Keep current metadata filter approach.
- Inject `responsiveStyles` attribute only when block is enabled in config.
- No default fallback behavior.

### Phase 2 Execution Steps

#### A. Config and schema foundation
1. Add constants and schema versioning in PHP:
- option name
- schema version
- default config (empty array - no defaults)
2. Add option read/write helpers with normalization.
3. Add sanitization/validation for incoming config:
- block names must be valid namespace format
- attribute path must be safe dot notation
- allowed `valueKind` values only

#### B. Editor data source for blocks and attributes
1. Build an editor-side discovery layer:
- list registered block types from `core/blocks` store
- read attribute schemas from block settings (`attributes` object)
2. Convert discovered attributes to selectable candidates:
- include scalar fields
- include object fields
- for object fields, provide selectable leaf paths where practical
3. Exclude unsafe/unhelpful candidates:
- internal-only attributes
- very large/opaque structures where responsive override is not meaningful

#### C. Header button and popup UI
1. Add a Plugin UI entry in editor header (for example via `PluginMoreMenuItem` + `PluginPrePublishPanel` style APIs or a header slot-fill approach appropriate to current WP version).
2. Implement popup/modal component:
- searchable block list
- per-block attribute checklist
- selected count summary
- save/cancel actions
3. Save flow:
- submit to REST endpoint or authenticated admin-ajax handler
- nonce + capability check (`manage_options` or chosen capability)
- show success/error notices

#### D. Settings persistence endpoint
1. Register secure settings route or settings API endpoint:
- permission callback with capability check
- nonce verification for mutating requests
2. Persist normalized config to option.
3. Return sanitized persisted config for editor hydration.

#### E. Generic editor interception refactor
1. Replace hardcoded `TARGET_BLOCK` and padding functions with config-driven matcher.
2. For each intercepted block update:
- determine selected responsive paths for that block
- on Desktop: keep core attribute write, mirror to `responsiveStyles.desktop[pathKey]`
- on Tablet/Mobile: write responsive value to `responsiveStyles.{device}[pathKey]` and preserve desktop values
3. Support mixed value shapes:
- scalar: direct value copy
- object: deep merge by leaf path to avoid dropping sibling keys
4. Keep no-op behavior for non-selected blocks/attributes.

#### F. Generic preview behavior in editor canvas
1. Apply preview overrides only for active device and selected paths.
2. Compose wrapper style or block props safely without clobbering unrelated styles.
3. Ensure preview reads from responsive payload and does not mutate desktop source values.

#### G. Frontend render refactor
1. Replace hardcoded group/padding renderer with config-driven renderer.
2. For each configured block/path:
- read responsive value for tablet/mobile
- map to CSS declarations using path-specific mappers
3. Start with mapper registry:
- `style.spacing.padding.*` mapper (existing)
- scalar style mappers (example candidate: text color path)
4. Generate deterministic, per-instance selector class and media queries.
5. Sanitize/escape all output based on mapper type.
R
#### I. Verification and release checklist
1. Manual editor tests:
- select block/attributes in popup
- set desktop/tablet/mobile values
- save/reload persistence check
2. Frontend checks:
- correct CSS output per selected block/path
- no bleed to unselected blocks
3. Regression checks:
- `core/group` padding still works with no config changes
- unsupported blocks unaffected
4. Security checks:
- capability + nonce on settings updates
- sanitization and escaping paths covered
5.unsupported blocks unaffected
- no unintended defaults appli
- run PHP lint + JS lint if available

### Initial Target Set for Phase 2 (Pragmatic Start)
1. Keep existing stable path first:
- `core/group` -> `style.spacing.padding`
2. Add one scalar pilot path (example):
- a text/color-like style path on a core text block
3. Add one object pilot beyond padding only after scalar pipeline is stable.
Plugin starts with no default targets - user must explicitly select via popup.
2. Example scalable paths available for selection:
- `style.spacing.padding` (object mapper)
- `style.color.text` (scalar mapper)
3. Add additional mapper support as needed
- Mitigation: fast block/path lookup tables and early returns.
3. UI complexity risk for large block lists
- Mitigation: search/filter, lazy rendering, and sensible defaults.
4. Data migration risk
- Mitigation: non-destructive read migration and legacy fallback support.

### Deliverables
1. Editor header button + popup attribute selector.
2. Persistent config option + secure save endpoint.
5. Backward compatibility with current Phase 1 payload.
