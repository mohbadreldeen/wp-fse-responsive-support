<?php
/**
 * Plugin Name:       Responsive Overrides
 * Description:       Example block scaffolded with Create Block tool.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       responsive-overrides
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

function enqueue_themeplix_block_editor() {
	$asset_file = __DIR__ . '/build/themeplix-block-editor.asset.php';
	
	if ( ! file_exists( $asset_file ) ) {
		return;
	}
	
	$asset = require_once $asset_file;
	
	wp_enqueue_script(
		'themeplix-block-editor',
		plugins_url( 'build/themeplix-block-editor.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version'],
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'enqueue_themeplix_block_editor' );

function add_responsive_attributes( $settings, $metadata ) {
	if ( empty( $metadata['name'] ) || 'core/group' !== $metadata['name'] ) {
		return $settings;
	}

	if ( ! isset( $settings['attributes'] ) || ! is_array( $settings['attributes'] ) ) {
		$settings['attributes'] = array();
	}

	$settings['attributes']['responsiveStyles'] = array(
		'type'    => 'object',
		'default' => array(
			'desktop' => array(),
			'tablet'  => array(),
			'mobile'  => array(),
		),
	);

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'add_responsive_attributes', 10, 2 );

/**
 * Get responsive breakpoint widths matching Gutenberg editor device preview.
 *
 * @return array<string, int> Map of device to max-width in pixels.
 */
function ro_get_responsive_breakpoints() {
	/**
	 * Filter responsive breakpoint widths.
	 *
	 * Default values match Gutenberg's editor device preview breakpoints:
	 * - tablet: 1024px and below
	 * - mobile: 781px and below
	 *
	 * @param array $breakpoints Map of device to max-width in pixels.
	 */
	return apply_filters(
		'responsive_overrides_breakpoints',
		array(
			'tablet' => 780,
			'mobile' => 480,
		)
	);
}

/**
 * Convert Gutenberg's internal var:preset|…|… notation to a CSS custom property.
 *
 * E.g. "var:preset|spacing|medium" → "var(--wp--preset--spacing--medium)"
 *
 * @param string $value Raw attribute value.
 * @return string Resolved CSS value.
 */
function ro_resolve_preset_value( $value ) {
	if ( 0 !== strpos( $value, 'var:' ) ) {
		return $value;
	}

	$slug = substr( $value, 4 ); // strip leading "var:"
	$slug = str_replace( '|', '--', $slug );

	return 'var(--wp--' . $slug . ')';
}

/**
 * Build a safe CSS spacing declaration map from a device entry in responsiveStyles.
 *
 * Expected format: { "padding": { "top": "20px", "right": "10px", … } }
 *
 * @param array $device_data Device payload from responsiveStyles.
 * @return array<string, string>
 */
function ro_get_device_spacing_declarations( $device_data ) {
	if ( ! is_array( $device_data ) ) {
		return array();
	}

	$padding = $device_data['padding'] ?? array();
	if ( ! is_array( $padding ) ) {
		return array();
	}

	$property_map = array(
		'top'    => 'padding-top',
		'right'  => 'padding-right',
		'bottom' => 'padding-bottom',
		'left'   => 'padding-left',
	);

	$declarations = array();
	foreach ( $property_map as $side => $css_property ) {
		if ( ! isset( $padding[ $side ] ) || ! is_string( $padding[ $side ] ) ) {
			continue;
		}

		$value = ro_resolve_preset_value( trim( $padding[ $side ] ) );
		if ( '' === $value ) {
			continue;
		}

		// Allow only safe CSS length values and var() custom properties.
		if ( ! preg_match( '/^-?(?:\\d+|\\d*\\.\\d+)(?:px|em|rem|vw|vh|%)$|^0$|^var\(--[\w-]+/', $value ) ) {
			continue;
		}

		$declarations[ $css_property ] = $value;
	}

	return $declarations;
}

/**
 * Render responsive spacing overrides for core/group.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block data.
 * @return string
 */
function ro_render_responsive_group_spacing( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || 'core/group' !== $block['blockName'] ) {
		return $block_content;
	}

	$attrs = $block['attrs'] ?? array();
	if ( empty( $attrs['responsiveStyles'] ) || ! is_array( $attrs['responsiveStyles'] ) ) {
		return $block_content;
	}

	$desktop_declarations = ro_get_device_spacing_declarations( $attrs['responsiveStyles']['desktop'] ?? array() );
	$tablet_declarations  = ro_get_device_spacing_declarations( $attrs['responsiveStyles']['tablet'] ?? array() );
	$mobile_declarations  = ro_get_device_spacing_declarations( $attrs['responsiveStyles']['mobile'] ?? array() );

	// Nothing responsive to do.
	if ( empty( $desktop_declarations ) && empty( $tablet_declarations ) && empty( $mobile_declarations ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( ! $processor->next_tag() ) {
		return $block_content;
	}

	static $instance = 0;
	$instance++;
	$class_name = 'ro-rsp-' . (string) $instance;
	$processor->add_class( $class_name );

	// Strip inline padding so our CSS rules are the sole authority.
	$existing_style = $processor->get_attribute( 'style' );
	if ( is_string( $existing_style ) ) {
		$cleaned_style = preg_replace(
			'/padding-(top|right|bottom|left)\s*:[^;]*;?/',
			'',
			$existing_style
		);
		$cleaned_style = trim( $cleaned_style, ' ;' );
		if ( $cleaned_style ) {
			$processor->set_attribute( 'style', $cleaned_style );
		} else {
			$processor->remove_attribute( 'style' );
		}
	}

	$updated_content = $processor->get_updated_html();
	$css_parts       = array();
	$breakpoints     = ro_get_responsive_breakpoints();

	// Desktop base rule.
	if ( ! empty( $desktop_declarations ) ) {
		$decl = '';
		foreach ( $desktop_declarations as $property => $value ) {
			$decl .= $property . ':' . $value . ';';
		}
		$css_parts[] = '.' . $class_name . '{' . $decl . '}';
	}

	if ( ! empty( $tablet_declarations ) ) {
		$decl = '';
		foreach ( $tablet_declarations as $property => $value ) {
			$decl .= $property . ':' . $value . ';';
		}
		$css_parts[] = sprintf(
			'@media (max-width:%dpx){.%s{%s}}',
			$breakpoints['tablet'],
			$class_name,
			$decl
		);
	}

	if ( ! empty( $mobile_declarations ) ) {
		$decl = '';
		foreach ( $mobile_declarations as $property => $value ) {
			$decl .= $property . ':' . $value . ';';
		}
		$css_parts[] = sprintf(
			'@media (max-width:%dpx){.%s{%s}}',
			$breakpoints['mobile'],
			$class_name,
			$decl
		);
	}

	if ( empty( $css_parts ) ) {
		return $updated_content;
	}

	return $updated_content . '<style>' . implode( '', $css_parts ) . '</style>';
}
add_filter( 'render_block', 'ro_render_responsive_group_spacing', 10, 2 );

if ( ! function_exists( 'ro_debug' ) ) {
	/**
	 * Log any value to the WordPress debug log.
	 *
	 * @param mixed       $content Data to log.
	 * @param string|null $label   Optional label prefix.
	 * @return void
	 */
	function ro_debug( $content, $label = null ) {
		if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
			return;
		}

		$prefix = '[responsive-overrides]';
		if ( ! empty( $label ) ) {
			$prefix .= ' ' . $label . ':';
		}

		if ( is_scalar( $content ) || null === $content ) {
			error_log( $prefix . ' ' . var_export( $content, true ) );
			return;
		}

		error_log( $prefix . ' ' . wp_json_encode( $content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
	}
}