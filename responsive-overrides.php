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
/**
 * Registers the block(s) metadata from the `blocks-manifest.php` and registers the block type(s)
 * based on the registered block metadata. Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
function create_block_responsive_overrides_block_init() {
	if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
		wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
		return;
	}

	register_block_type( __DIR__ . '/build/responsive-overrides' );
}
add_action( 'init', 'create_block_responsive_overrides_block_init' );


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

		$value = trim( $padding[ $side ] );
		if ( '' === $value ) {
			continue;
		}

		// Allow only safe CSS length values.
		if ( ! preg_match( '/^-?(?:\\d+|\\d*\\.\\d+)(?:px|em|rem|vw|vh|%)$|^0$|^var\(--/', $value ) ) {
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

	$tablet_declarations = ro_get_device_spacing_declarations( $attrs['responsiveStyles']['tablet'] ?? array() );
	$mobile_declarations = ro_get_device_spacing_declarations( $attrs['responsiveStyles']['mobile'] ?? array() );

	if ( empty( $tablet_declarations ) && empty( $mobile_declarations ) ) {
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

	$updated_content = $processor->get_updated_html();
	$css_parts      = array();

	if ( ! empty( $tablet_declarations ) ) {
		$decl = '';
		foreach ( $tablet_declarations as $property => $value ) {
			$decl .= $property . ':' . $value . ';';
		}
		$css_parts[] = '@media (min-width:782px) and (max-width:1024px){.' . $class_name . '{' . $decl . '}}';
	}

	if ( ! empty( $mobile_declarations ) ) {
		$decl = '';
		foreach ( $mobile_declarations as $property => $value ) {
			$decl .= $property . ':' . $value . ';';
		}
		$css_parts[] = '@media (max-width:781px){.' . $class_name . '{' . $decl . '}}';
	}

	if ( empty( $css_parts ) ) {
		return $updated_content;
	}

	return $updated_content . '<style>' . esc_html( implode( '', $css_parts ) ) . '</style>';
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