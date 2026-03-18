# Gutenberg Style & Attribute Logic

This document defines how block styles and attributes are handled in this project to ensure consistency between theme presets and custom user overrides.

## 1. Background Color Logic (Dual-Attribute System)

Gutenberg uses two distinct locations for background colors depending on the source. Always account for both:

- **Theme Presets:** When a user selects a color from the palette, it is stored in `attributes.backgroundColor` as a **slug** (e.g., `"primary"`).
  - _Resulting Class:_ `has-{slug}-background-color`
- **Custom Scalar Values:** When a user picks a custom hex/RGB value, it is stored in `attributes.style.color.background` as a **string** (e.g., `"#ff0000"`).
  - _Resulting Style:_ `style="background-color: #ff0000"`

## 2. Implementation Standards

- **Wrapper Attributes:** Never manually concatenate classes for colors. Always use the `useBlockProps` hook in `edit.js` and `useBlockProps.save()` in `save.js`. This hook automatically merges the slug-based class and the inline style object.
- **Block Supports:** Ensure `block.json` includes `"color": { "background": true }` in the `supports` object to enable this behavior natively.

## 3. Data Retrieval Pattern

If logic requires the raw color value (e.g., for an external library like Anime.js or Canvas):

1. Check `attributes.style?.color?.background` for a hard-coded value first.
2. If null, use the slug in `attributes.backgroundColor` to look up the theme value (if available in the window context or editor settings).

## 4. Pattern Overrides (WP 7.0+)

As of WordPress 7.0, any attribute supporting **Block Bindings** also supports **Pattern Overrides**. When building custom blocks:

- Register attributes with binding support in `block.json`.
- This allows the `style` object or `backgroundColor` slug to be overridden in synced patterns without breaking the sync.
