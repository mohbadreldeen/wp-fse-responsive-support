---
name: gutenberg-clean-code
description: "Use when writing, reviewing, or refactoring WordPress Gutenberg plugin/block code for clarity, maintainability, predictable editor behavior, and safe evolution."
compatibility: "WordPress 6.9+ and modern Gutenberg block development (JS/TS + PHP)."
---

# Gutenberg Clean Code

## When to use

Use this skill for Gutenberg-focused quality work:

- Refactoring block editor logic (HOCs, hooks, stores, selectors)
- Improving block attribute handling and serialization safety
- Cleaning responsive/editor-preview behavior logic
- Improving block registration and metadata consistency
- Strengthening tests for block behavior and state transitions
- Reducing coupling between editor, data layer, and rendering paths

## Inputs required

- Block/plugin scope and target files
- Current behavior and reproducible scenarios
- Active constraints:
  - Backward compatibility with saved block content
  - Editor UX expectations
  - Performance and re-render sensitivity
- Existing tests (unit/integration/e2e where available)

## Gutenberg quality principles

- Preserve block validity and backward compatibility.
- Keep editor behavior deterministic across device previews and attribute updates.
- Keep attribute synchronization explicit and testable.
- Minimize hidden mutations and implicit data coupling.
- Make naming reflect user-facing concepts (targets, devices, styles, fallbacks).

## Procedure

### 1) Guard behavior before refactor

1. Identify affected blocks and attributes.
2. Confirm current behavior:
   - Initial mount behavior
   - Device switch behavior
   - setAttributes interception behavior
3. Add/verify tests before structural refactors.

### 2) Improve naming and boundaries

1. Use names that reveal intent:
   - Example areas: mount sync, device sync, responsive update building
2. Separate responsibilities:
   - Value retrieval/fallback logic
   - Patch generation logic
   - Effect orchestration logic
3. Keep helpers pure where possible.

### 3) Keep setAttributes interactions safe

1. Build minimal attribute patches to avoid unnecessary updates.
2. Avoid update loops by clearly distinguishing sync-driven updates vs user-driven updates.
3. Keep top-level patching behavior explicit and test-covered.
4. Ensure undefined handling is intentional for unsetting attributes.

### 4) Refactor for one abstraction level per function

1. Split functions that mix:
   - Data traversal
   - Responsive fallback strategy
   - Patch creation
   - Side-effect scheduling
2. Keep effect hooks focused:
   - Mount sync effect
   - Device transition effect
   - Intercepted setAttributes path
3. Encapsulate requestAnimationFrame scheduling behind a small utility.

### 5) Gutenberg-specific smells to remove

- Repeated responsive read/write patterns without shared helpers
- Implicit fallback rules spread across multiple callsites
- Equality checks that hide expensive behavior in hot paths
- Unclear distinction between explicit and inherited responsive values
- Broad any usage where a narrow local type can improve safety

### 6) Error and edge handling

1. Handle missing paths/undefined values predictably.
2. Keep object path access and mutation logic centralized.
3. Explicitly test:
   - Missing target paths
   - Undefined incoming and current values
   - Device fallback edge cases
   - No-op updates

### 7) Tests for Gutenberg behavior

1. Prioritize deterministic tests around behavior transitions:
   - Mount sync with/without desktop value
   - Device switch writes previous and applies current fallback
   - Intercepted updates only change responsiveStyles when needed
2. Keep tests focused and scenario-named.
3. Verify no regressions in block invalidation/attribute persistence flows.

### 8) Comments policy in block code

1. Keep comments for intent and lifecycle rationale only.
2. Avoid comments that restate obvious hook/function behavior.
3. Remove stale implementation comments during refactor.

### 9) Performance and render hygiene

1. Reduce unnecessary cloning or deep comparisons in hot paths.
2. Keep effect dependencies intentional.
3. Avoid extra setAttributes calls when no material patch exists.
4. Keep selector usage and derived state stable.

## Verification checklist

- Device transitions produce expected live values and stored responsive values.
- Mount behavior initializes responsive styles correctly without unintended overrides.
- setAttributes interception does not cause loops or redundant updates.
- Undefined/unset behavior works as intended.
- Test coverage includes key edge scenarios and regressions.
- Refactor improves readability without changing intended behavior.

## Gutenberg-specific failure modes

- Silent block behavior regressions due to fallback rule changes
- Overwriting inherited values as explicit values unnecessarily
- Infinite or near-infinite update churn from sync flags/effects
- Hidden coupling between editor preview state and persisted attributes
- Refactors that reduce clarity of responsive target expansion logic
