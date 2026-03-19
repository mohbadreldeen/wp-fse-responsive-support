# withResponsiveLogic Current Behavior

This document describes the current runtime behavior of `src/block-editor/with-responsive-logic.tsx` so future changes preserve the existing data flow.

## 1. Purpose

`withResponsiveLogic` is a Gutenberg higher-order component that wraps `BlockEdit` and keeps responsive values synchronized between:

- live block attributes for the currently active preview device
- `attributes.responsiveStyles`, which stores per-device values for registered responsive targets

The wrapper only activates when `useActiveTargets( props.name )` returns one or more responsive targets.

## 2. Helper Behavior

The file defines two local helpers that are part of the current flow:

- `setValueAtPath( object, path, value )`
  - Walks a dot-path and writes the value into the cloned attributes object.
  - Creates missing intermediate objects.
  - Merges objects when both the existing value and the incoming value are objects.
- `hasPathInObject( object, path )`
  - Returns `true` only when every segment of the dot-path exists as an own property.
  - This is used to decide whether an intercepted `setAttributes` payload is touching a responsive target.

## 3. Device Resolution

The current editor preview device is read from `core/editor.getDeviceType()` and normalized to lowercase.

- missing device values fall back to `"Desktop"`
- the stored device keys are expected to match the lowercase form, such as `desktop`, `tablet`, and `mobile`

The component keeps `prevDeviceRef` so it can persist the outgoing device state before hydrating the incoming one.

## 4. Mount-Time Sync

The first `useEffect` runs once, guarded by `didMountRef`.

For each active responsive target:

- it checks whether a desktop value already exists in `responsiveStyles`
- if the desktop value is missing, it reads the live value from the current attributes and seeds `responsiveStyles.desktop`
- if the desktop value exists, it writes that desktop value back into the live attributes object

If any target causes a change:

- `nextAttributes.responsiveStyles` is updated
- `isSyncingRef` is set to `true`
- `setAttributes( nextAttributes )` is called
- `isSyncingRef` is reset on the next animation frame

Current implication:

- desktop is treated as the initial canonical source when stored responsive data already exists
- otherwise the current live attribute state is promoted into `responsiveStyles.desktop`

## 5. Device-Switch Sync

The second `useEffect` runs whenever the normalized device changes.

If the device actually changed:

1. Read the current live value for each responsive target.
2. Persist that live value into the previous device bucket in `responsiveStyles`.
3. If a live value is `undefined`, remove the previous device entry for that target instead.
4. Clone the current attributes.
5. Load the new device value from `responsiveStyles` into the live attributes.
6. If the new device has no stored value, write `undefined` to the live path.
7. Store the updated `responsiveStyles` back onto the attributes object.
8. Call `setAttributes` while `isSyncingRef` is enabled.

Current implication:

- switching preview devices treats the currently rendered attributes as the value to save for the device being left
- the device being entered is then hydrated from `responsiveStyles`
- missing values on the destination device currently clear the live attribute path by writing `undefined`

## 6. Intercepted Attribute Writes

The wrapper replaces `props.setAttributes` with `interceptedSetAttributes` and passes that version into `BlockEdit`.

### Sync guard

If `isSyncingRef.current` is `true`, the wrapper forwards the update directly to the original `setAttributes` and does not modify `responsiveStyles`.

This prevents the mount effect and device-switch effect from recursively reprocessing their own writes.

### Responsive update flow

When the wrapper receives a user-driven attribute update:

- it clones the current `responsiveStyles`
- it checks each active target to see whether `newAttrs` explicitly includes that target path
- it compares the incoming value with the current live value
- if the incoming value is `undefined`, it removes the target from the current device bucket
- if the incoming value changed, it stores the new value in the current device bucket with `setResponsiveValue`

If no responsive target changed, the wrapper forwards `newAttrs` unchanged.

If at least one responsive target changed, the wrapper calls:

`setAttributes( { ...newAttrs, responsiveStyles: nextResponsiveStyles } )`

Current implication:

- responsive storage is only updated for target paths that are explicitly present in the incoming `setAttributes` payload
- unrelated attribute updates bypass responsive storage changes
- equality is currently checked with `JSON.stringify`, so object ordering affects the comparison semantics

## 7. Refs Used As Runtime State

The current implementation uses refs to coordinate sync behavior without rerender-driven state transitions:

- `prevDeviceRef` stores the last active device
- `isSyncingRef` marks internal programmatic writes
- `attrsRef` always points at the latest `attributes`
- `didMountRef` ensures the mount hydration logic runs once

## 8. Current Side Effects And Diagnostics

The file currently includes `console.log` calls in two places:

- after device-switch synchronization
- inside `interceptedSetAttributes`

These logs are part of the current behavior and should be considered temporary diagnostics rather than a formal API.

## 9. Working Mental Model

The current implementation behaves as a two-way sync layer:

- live attributes represent the active device view shown in the editor
- `responsiveStyles` is the cross-device storage map
- mount sync establishes the initial desktop state
- device changes persist the outgoing device and hydrate the incoming device
- intercepted attribute writes update the active device bucket unless the update is an internal sync write

When changing this file, preserve that sequence unless the responsive storage contract is being intentionally redesigned.