# Responsive Overrides

- Contributors: The WordPress Contributors
- Tags: block
- Tested up to: 6.8
- Stable tag: 0.1.0
- License: GPL-2.0-or-later
- License URI: https://www.gnu.org/licenses/gpl-2.0.html

Responsive Overrides adds editor-side responsive target selection and per-device attribute storage for supported Gutenberg block attributes.

## Description

The plugin currently includes:

- responsive target discovery for supported block attributes
- editor logic that syncs live block attributes with `responsiveStyles` per device
- preview adapters that apply stored responsive values while switching between Desktop, Tablet, and Mobile previews

## Development

Use `npm` for local development in this repository.

1. Install dependencies with `npm install`
2. Start the editor build in watch mode with `npm run start`
3. Create a production build with `npm run build`
4. Run unit tests with `npm run test:unit`
5. Build a distributable plugin zip with `npm run plugin-zip`

## Installation

1. Upload the plugin files to `/wp-content/plugins/responsive-overrides`, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the Plugins screen in WordPress.

## FAQ

### How do I start development?

Install dependencies with `npm install`, then run `npm run start` to watch and rebuild editor assets.

### How do I run tests?

Run `npm run test:unit`.

## Screenshots

1. Responsive target selection in the block editor.
2. Device-specific preview behavior for stored responsive values.

## Changelog

### 0.1.0

- Release

## Build Notes

Editor assets are generated from the source files in `src/` using the npm scripts defined in `package.json`.
