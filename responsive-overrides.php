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

const RO_OPTION_NAME    = 'responsive_overrides_targets_v1';
const RO_SCHEMA_VERSION = 1;

/**
 * Default target config (empty - user must explicitly select targets).
 *
 * @return array<string, mixed>
 */
function ro_get_default_targets_config() {
	return array(
		'version' => RO_SCHEMA_VERSION,
		'targets' => array(),
	);
}

/**
 * Encode an attribute path into a deterministic safe object key.
 * Replace dots with double underscores to prevent nested object interpretation.
 *
 * @param string $path Attribute dot path.
 * @return string
 */
function ro_encode_path_key( $path ) {
	return str_replace( '.', '__', $path );
}

/**
 * Sanitize incoming target payload.
 *
 * @param mixed $payload Input payload.
 * @return array<string, mixed>
 */
function ro_sanitize_targets_config( $payload ) {
	$default = ro_get_default_targets_config();

	if ( ! is_array( $payload ) ) {
		return $default;
	}

	$raw_targets = $payload['targets'] ?? array();
	if ( ! is_array( $raw_targets ) ) {
		return $default;
	}

	$forbidden_paths = array( 'style' );

	$targets = array();
	foreach ( $raw_targets as $target ) {
		if ( ! is_array( $target ) ) {
			continue;
		}

		$block = isset( $target['block'] ) ? sanitize_text_field( (string) $target['block'] ) : '';
		$path  = isset( $target['path'] ) ? trim( sanitize_text_field( (string) $target['path'] ) ) : '';

		if ( ! preg_match( '/^[a-z0-9-]+\/[a-z0-9-]+$/', $block ) ) {
			continue;
		}

		if ( ! preg_match( '/^[a-zA-Z0-9_.-]+$/', $path ) ) {
			continue;
		}

		if ( in_array( strtolower( $path ), $forbidden_paths, true ) ) {
			continue;
		}

		$value_kind = isset( $target['valueKind'] ) ? sanitize_text_field( (string) $target['valueKind'] ) : 'object';
		if ( ! in_array( $value_kind, array( 'scalar', 'object' ), true ) ) {
			$value_kind = 'object';
		}

		$leaf_keys = array();
		if ( isset( $target['leafKeys'] ) && is_array( $target['leafKeys'] ) ) {
			foreach ( $target['leafKeys'] as $leaf_key ) {
				$leaf_key = sanitize_text_field( (string) $leaf_key );
				if ( preg_match( '/^[a-zA-Z0-9_.-]+$/', $leaf_key ) ) {
					$leaf_keys[] = $leaf_key;
				}
			}
		}

		$css_property = isset( $target['cssProperty'] )
			? trim( sanitize_text_field( (string) $target['cssProperty'] ) )
			: '';
		if ( '' !== $css_property && ! preg_match( '/^[a-z][a-z0-9-]*$/', $css_property ) ) {
			$css_property = '';
		}

		$style_strategy = isset( $target['styleStrategy'] )
			? trim( sanitize_text_field( (string) $target['styleStrategy'] ) )
			: '';
		if ( '' !== $style_strategy && ! in_array( $style_strategy, array( 'padding', 'margin', 'border-radius', 'border-width', 'border-color', 'border-style' ), true ) ) {
			$style_strategy = '';
		}

		if ( '' === $style_strategy && 'object' === $value_kind ) {
			if ( 'style.spacing.padding' === $path ) {
				$style_strategy = 'padding';
			} elseif ( 'style.spacing.margin' === $path ) {
				$style_strategy = 'margin';
			} elseif ( 'style.border.radius' === $path ) {
				$style_strategy = 'border-radius';
			} elseif ( 'style.border.width' === $path ) {
				$style_strategy = 'border-width';
			} elseif ( 'style.border.color' === $path ) {
				$style_strategy = 'border-color';
			} elseif ( 'style.border.style' === $path ) {
				$style_strategy = 'border-style';
			}
		}

		if ( 'scalar' === $value_kind && '' === $css_property ) {
			continue;
		}

		if ( 'object' === $value_kind && '' === $style_strategy ) {
			continue;
		}

		$targets[] = array(
			'block'     => $block,
			'path'      => $path,
			'valueKind' => $value_kind,
			'leafKeys'  => array_values( array_unique( $leaf_keys ) ),
			'cssProperty' => $css_property,
			'styleStrategy' => $style_strategy,
		);
	}

	if ( empty( $targets ) ) {
		$targets = $default['targets'];
	}

	return array(
		'version' => RO_SCHEMA_VERSION,
		'targets' => $targets,
	);
}

/**
 * Read plugin target config.
 *
 * @return array<string, mixed>
 */
function ro_get_targets_config() {
	$raw_value = get_option( RO_OPTION_NAME, null );

	if ( null === $raw_value ) {
		return ro_get_default_targets_config();
	}

	return ro_sanitize_targets_config( $raw_value );
}

/**
 * Persist plugin target config.
 *
 * @param array<string, mixed> $config Config payload.
 * @return bool
 */
function ro_set_targets_config( $config ) {
	$sanitized = ro_sanitize_targets_config( $config );
	$current = get_option( RO_OPTION_NAME, null );
	if ( $current === $sanitized ) {
		return true;
	}

	return (bool) update_option( RO_OPTION_NAME, $sanitized, false );
}

/**
 * Build targets grouped by block.
 *
 * @return array<string, array<int, array<string, mixed>>>
 */
function ro_get_targets_by_block() {
	$config  = ro_get_targets_config();
	$targets = $config['targets'] ?? array();

	$by_block = array();
	foreach ( $targets as $target ) {
		if ( ! is_array( $target ) || empty( $target['block'] ) ) {
			continue;
		}

		$block_name = (string) $target['block'];
		if ( ! isset( $by_block[ $block_name ] ) ) {
			$by_block[ $block_name ] = array();
		}

		$by_block[ $block_name ][] = $target;
	}

	return $by_block;
}

/**
 * Register REST routes for editor config management.
 *
 * @return void
 */
function ro_register_rest_routes() {
	register_rest_route(
		'responsive-overrides/v1',
		'/targets',
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => function() {
					return current_user_can( 'edit_posts' );
				},
				'callback'            => function() {
					return rest_ensure_response( ro_get_targets_config() );
				},
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
				'callback'            => function( WP_REST_Request $request ) {
					$params   = $request->get_json_params();
					$config   = ro_sanitize_targets_config( is_array( $params ) ? $params : array() );
					$updated  = ro_set_targets_config( $config );

					if ( false === $updated ) {
						return new WP_Error( 'ro_save_failed', 'Failed to save responsive targets.', array( 'status' => 500 ) );
					}

					return rest_ensure_response( $config );
				},
			),
		)
	);
}
add_action( 'rest_api_init', 'ro_register_rest_routes' );

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

	$boot_data = array(
		'restPath' => '/responsive-overrides/v1/targets',
		'nonce'    => wp_create_nonce( 'wp_rest' ),
		'config'   => ro_get_targets_config(),
	);

	wp_add_inline_script(
		'themeplix-block-editor',
		'window.responsiveOverridesSettings = ' . wp_json_encode( $boot_data ) . ';',
		'before'
	);
}
add_action( 'enqueue_block_editor_assets', 'enqueue_themeplix_block_editor' );

function add_responsive_attributes( $settings, $metadata ) {
	$block_name = $metadata['name'] ?? '';
	if ( empty( $block_name ) ) {
		return $settings;
	}

	$targets_by_block = ro_get_targets_by_block();
	if ( ! isset( $targets_by_block[ $block_name ] ) ) {
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

	// Ensure supports for custom spacing/dimensions so responsive changes persist
	if ( ! isset( $settings['supports'] ) ) {
		$settings['supports'] = array();
	}

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'add_responsive_attributes', 10, 2 );

/**
 * Admin notice helper to show current responsive configuration.
 */
function ro_show_admin_debug_info() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$config = ro_get_targets_config();
	$target_count = count( $config['targets'] ?? array() );
	
	if ( isset( $_GET['ro_debug'] ) ) {
		?>
		<div class="notice notice-info">
			<p><strong>Responsive Overrides Debug:</strong></p>
			<p>Active targets: <?php echo esc_html( $target_count ); ?></p>
			<pre><?php echo esc_html( wp_json_encode( $config, JSON_PRETTY_PRINT ) ); ?></pre>
		</div>
		<?php
	}
}
add_action( 'admin_notices', 'ro_show_admin_debug_info' );


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

	$declarations = array();

	// Handle padding
	$padding = $device_data['padding'] ?? array();
	if ( is_array( $padding ) ) {
		$property_map = array(
			'top'    => 'padding-top',
			'right'  => 'padding-right',
			'bottom' => 'padding-bottom',
			'left'   => 'padding-left',
		);

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
	}

	// Handle margin
	$margin = $device_data['margin'] ?? array();
	if ( is_array( $margin ) ) {
		$property_map = array(
			'top'    => 'margin-top',
			'right'  => 'margin-right',
			'bottom' => 'margin-bottom',
			'left'   => 'margin-left',
		);

		foreach ( $property_map as $side => $css_property ) {
			if ( ! isset( $margin[ $side ] ) || ! is_string( $margin[ $side ] ) ) {
				continue;
			}

			$value = ro_resolve_preset_value( trim( $margin[ $side ] ) );
			if ( '' === $value ) {
				continue;
			}

			// Allow only safe CSS length values and var() custom properties.
			if ( ! preg_match( '/^-?(?:\\d+|\\d*\\.\\d+)(?:px|em|rem|vw|vh|%)$|^0$|^var\(--[\w-]+/', $value ) ) {
				continue;
			}

			$declarations[ $css_property ] = $value;
		}
	}

	return $declarations;
}

/**
 * Build a safe color declaration from a scalar value.
 *
 * @param mixed  $value Scalar style value.
 * @param string $property CSS property name (default: 'color').
 * @return array<string, string>
 */
function ro_get_text_color_declaration( $value, $property = 'color' ) {
	if ( ! is_string( $value ) ) {
		return array();
	}

	$value = trim( $value );
	if ( '' === $value ) {
		return array();
	}

	if ( preg_match( '/[;{}<>]/', $value ) ) {
		return array();
	}

	if ( preg_match( '/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value ) ) {
		$value = 'var(--wp--preset--color--' . $value . ')';
	} else {
		$value = ro_resolve_preset_value( $value );
	}

	if ( '' === $value ) {
		return array();
	}

	$allowed = preg_match( '/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^(?:rgb|rgba|hsl|hsla)\([^\)]*\)$|^var\(--[\w-]+\)$/', $value );
	if ( ! $allowed ) {
		return array();
	}

	return array( $property => $value );
}

/**
 * Convert camelCase token to kebab-case.
 *
 * @param string $value Token.
 * @return string
 */
function ro_camel_to_kebab( $value ) {
	return strtolower( preg_replace( '/([a-z0-9])([A-Z])/', '$1-$2', (string) $value ) );
}

/**
 * Resolve a target path to a CSS property.
 *
 * @param string $path Dot path.
 * @return string
 */
function ro_get_css_property_for_path( $path ) {
	$path = trim( (string) $path );
	if ( '' === $path || 'style' === $path ) {
		return '';
	}

	$segments = explode( '.', $path );
	$leaf     = $segments[ count( $segments ) - 1 ];

	if ( 'style' !== ( $segments[0] ?? '' ) ) {
		return ro_camel_to_kebab( $leaf );
	}

	$namespace = $segments[1] ?? '';

	if ( 'color' === $namespace ) {
		if ( 'text' === $leaf ) {
			return 'color';
		}
		if ( 'background' === $leaf ) {
			return 'background-color';
		}
	}

	if ( 'spacing' === $namespace && 'blockGap' === $leaf ) {
		return 'gap';
	}

	if ( 'dimensions' === $namespace ) {
		if ( 'minHeight' === $leaf ) {
			return 'min-height';
		}
		if ( 'aspectRatio' === $leaf ) {
			return 'aspect-ratio';
		}
	}

	return ro_camel_to_kebab( $leaf );
}

/**
 * Sanitize a generic CSS value for safe inline stylesheet output.
 *
 * @param mixed $value Raw value.
 * @return string
 */
function ro_sanitize_generic_css_value( $value ) {
	if ( is_int( $value ) || is_float( $value ) ) {
		return (string) $value;
	}

	if ( ! is_string( $value ) ) {
		return '';
	}

	$value = ro_resolve_preset_value( trim( $value ) );
	if ( '' === $value ) {
		return '';
	}

	if ( preg_match( '/[;{}<>]/', $value ) ) {
		return '';
	}

	if ( ! preg_match( '/^[a-zA-Z0-9#.%(),\s\-_\/:"\']+$/', $value ) ) {
		return '';
	}

	return $value;
}

/**
 * Build declarations for non-specialized targets.
 *
 * @param string $path Target path.
 * @param mixed  $value Device value.
 * @param array  $target Target config.
 * @return array<string, string>
 */
function ro_get_generic_target_declarations( $path, $value, $target ) {
	$declarations = array();

	if ( is_array( $value ) ) {
		if ( 'style.border.radius' === $path ) {
			$corner_map = array(
				'topLeft'     => 'border-top-left-radius',
				'topRight'    => 'border-top-right-radius',
				'bottomRight' => 'border-bottom-right-radius',
				'bottomLeft'  => 'border-bottom-left-radius',
			);

			foreach ( $corner_map as $key => $property ) {
				if ( ! array_key_exists( $key, $value ) ) {
					continue;
				}

				$sanitized = ro_sanitize_generic_css_value( $value[ $key ] );
				if ( '' !== $sanitized ) {
					$declarations[ $property ] = $sanitized;
				}
			}

			return $declarations;
		}

		if ( 'style.border.width' === $path || 'style.border.color' === $path || 'style.border.style' === $path ) {
			$side_map = array(
				'top'    => '-top-',
				'right'  => '-right-',
				'bottom' => '-bottom-',
				'left'   => '-left-',
			);
			$leaf     = explode( '.', $path );
			$suffix   = ro_camel_to_kebab( $leaf[ count( $leaf ) - 1 ] );

			foreach ( $side_map as $key => $middle ) {
				if ( ! array_key_exists( $key, $value ) ) {
					continue;
				}

				$sanitized = ro_sanitize_generic_css_value( $value[ $key ] );
				if ( '' !== $sanitized ) {
					$declarations[ 'border' . $middle . $suffix ] = $sanitized;
				}
			}

			return $declarations;
		}

		$leaf_keys = array();
		if ( isset( $target['leafKeys'] ) && is_array( $target['leafKeys'] ) && ! empty( $target['leafKeys'] ) ) {
			$leaf_keys = $target['leafKeys'];
		} else {
			$leaf_keys = array_keys( $value );
		}

		foreach ( $leaf_keys as $leaf_key ) {
			if ( ! array_key_exists( $leaf_key, $value ) ) {
				continue;
			}

			$property = ro_get_css_property_for_path( $path . '.' . $leaf_key );
			if ( '' === $property ) {
				continue;
			}

			$sanitized = ro_sanitize_generic_css_value( $value[ $leaf_key ] );
			if ( '' !== $sanitized ) {
				$declarations[ $property ] = $sanitized;
			}
		}

		return $declarations;
	}

	$property = ro_get_css_property_for_path( $path );
	if ( '' === $property ) {
		return array();
	}

	$sanitized = ro_sanitize_generic_css_value( $value );
	if ( '' === $sanitized ) {
		return array();
	}

	return array( $property => $sanitized );
}

/**
 * Build declarations for object targets using an internal strategy.
 *
 * @param string $strategy Strategy key.
 * @param mixed  $value Object value from responsiveStyles.
 * @return array<string, string>
 */
function ro_get_object_strategy_declarations( $strategy, $value ) {
	if ( ! is_array( $value ) ) {
		if ( 'border-color' === $strategy ) {
			return ro_get_text_color_declaration( $value, 'border-color' );
		}

		if ( 'border-width' === $strategy || 'border-style' === $strategy ) {
			$property = 'border-width';
			if ( 'border-style' === $strategy ) {
				$property = 'border-style';
			}

			$sanitized = ro_sanitize_generic_css_value( $value );
			if ( '' === $sanitized ) {
				return array();
			}

			return array( $property => $sanitized );
		}

		return array();
	}

	$maps = array(
		'padding' => array(
			'top'    => 'padding-top',
			'right'  => 'padding-right',
			'bottom' => 'padding-bottom',
			'left'   => 'padding-left',
		),
		'margin' => array(
			'top'    => 'margin-top',
			'right'  => 'margin-right',
			'bottom' => 'margin-bottom',
			'left'   => 'margin-left',
		),
		'border-radius' => array(
			'topLeft'     => 'border-top-left-radius',
			'topRight'    => 'border-top-right-radius',
			'bottomRight' => 'border-bottom-right-radius',
			'bottomLeft'  => 'border-bottom-left-radius',
		),
		'border-width' => array(
			'top'    => 'border-top-width',
			'right'  => 'border-right-width',
			'bottom' => 'border-bottom-width',
			'left'   => 'border-left-width',
		),
		'border-color' => array(
			'top'    => 'border-top-color',
			'right'  => 'border-right-color',
			'bottom' => 'border-bottom-color',
			'left'   => 'border-left-color',
		),
		'border-style' => array(
			'top'    => 'border-top-style',
			'right'  => 'border-right-style',
			'bottom' => 'border-bottom-style',
			'left'   => 'border-left-style',
		),
	);

	if ( ! isset( $maps[ $strategy ] ) ) {
		return array();
	}

	$declarations = array();
	foreach ( $maps[ $strategy ] as $leaf_key => $property_name ) {
		if ( ! array_key_exists( $leaf_key, $value ) ) {
			continue;
		}

		$raw_leaf_value = $value[ $leaf_key ];
		if ( in_array( $property_name, array( 'color', 'background-color', 'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color' ), true ) ) {
			$color_declaration = ro_get_text_color_declaration( $raw_leaf_value, $property_name );
			if ( ! empty( $color_declaration[ $property_name ] ) ) {
				$declarations[ $property_name ] = $color_declaration[ $property_name ];
			}
			continue;
		}

		$sanitized = ro_sanitize_generic_css_value( $raw_leaf_value );
		if ( '' !== $sanitized ) {
			$declarations[ $property_name ] = $sanitized;
		}
	}

	return $declarations;
}

/**
 * Build a declaration list for a configured responsive target.
 *
 * @param array $attrs  Block attributes.
 * @param array $target Target config.
 * @param array $device_data Device payload.
 * @return array<string, string>
 */
function ro_get_target_declarations( $attrs, $target, $device_data ) {
	$path         = isset( $target['path'] ) ? (string) $target['path'] : '';
	$value_kind   = isset( $target['valueKind'] ) ? (string) $target['valueKind'] : 'scalar';
	$css_property = isset( $target['cssProperty'] ) ? trim( (string) $target['cssProperty'] ) : '';
	$style_strategy = isset( $target['styleStrategy'] ) ? trim( (string) $target['styleStrategy'] ) : '';

	if ( '' === $style_strategy && 'object' === $value_kind ) {
		if ( 'style.spacing.padding' === $path ) {
			$style_strategy = 'padding';
		} elseif ( 'style.spacing.margin' === $path ) {
			$style_strategy = 'margin';
		} elseif ( 'style.border.radius' === $path ) {
			$style_strategy = 'border-radius';
		} elseif ( 'style.border.width' === $path ) {
			$style_strategy = 'border-width';
		} elseif ( 'style.border.color' === $path ) {
			$style_strategy = 'border-color';
		} elseif ( 'style.border.style' === $path ) {
			$style_strategy = 'border-style';
		}
	}

	$path_key = ro_encode_path_key( $path );
	$value    = $device_data[ $path_key ] ?? null;

	// Color aliases can be stored in either style path or preset slug path,
	// depending on what the user edited in the block controls.
	if ( null === $value ) {
		$alias_path = '';
		if ( 'style.color.text' === $path ) {
			$alias_path = 'textColor';
		} elseif ( 'style.color.background' === $path ) {
			$alias_path = 'backgroundColor';
		} elseif ( 'style.border.color' === $path ) {
			$alias_path = 'borderColor';
		} elseif ( 'textColor' === $path ) {
			$alias_path = 'style.color.text';
		} elseif ( 'backgroundColor' === $path ) {
			$alias_path = 'style.color.background';
		} elseif ( 'borderColor' === $path ) {
			$alias_path = 'style.border.color';
		}

		if ( '' !== $alias_path ) {
			$alias_key = ro_encode_path_key( $alias_path );
			if ( array_key_exists( $alias_key, $device_data ) ) {
				$value = $device_data[ $alias_key ];
			}
		}
	}

	if ( 'object' === $value_kind ) {
		if ( ! is_array( $value ) || '' === $style_strategy ) {
			return array();
		}

		return ro_get_object_strategy_declarations( $style_strategy, $value );
	}

	if ( '' === $css_property ) {
		return array();
	}

	if ( in_array( $css_property, array( 'color', 'background-color', 'border-color' ), true ) ) {
		return ro_get_text_color_declaration( $value, $css_property );
	}

	$sanitized = ro_sanitize_generic_css_value( $value );
	if ( '' === $sanitized ) {
		return array();
	}

	return array( $css_property => $sanitized );
}

/**
 * Render responsive overrides for configured targets.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block data.
 * @return string
 */
function ro_render_responsive_group_spacing( $block_content, $block ) {
	$block_name = $block['blockName'] ?? '';
	if ( empty( $block_name ) ) {
		return $block_content;
	}

	$targets_by_block = ro_get_targets_by_block();
	$targets          = $targets_by_block[ $block_name ] ?? array();
	if ( empty( $targets ) ) {
		return $block_content;
	}

	$attrs = $block['attrs'] ?? array();
	
	// Debug: log what we're receiving
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		ro_debug( array(
			'block_name' => $block_name,
			'has_responsiveStyles' => isset( $attrs['responsiveStyles'] ),
			'attrs_keys' => array_keys( $attrs ),
		), 'RENDER DEBUG' );
	}
	
	if ( empty( $attrs['responsiveStyles'] ) || ! is_array( $attrs['responsiveStyles'] ) ) {
		return $block_content;
	}

	$desktop_declarations = array();
	$tablet_declarations  = array();
	$mobile_declarations  = array();

	foreach ( $targets as $target ) {
		$desktop_declarations = array_merge(
			$desktop_declarations,
			ro_get_target_declarations( $attrs, $target, $attrs['responsiveStyles']['desktop'] ?? array() )
		);
		$tablet_declarations = array_merge(
			$tablet_declarations,
			ro_get_target_declarations( $attrs, $target, $attrs['responsiveStyles']['tablet'] ?? array() )
		);
		$mobile_declarations = array_merge(
			$mobile_declarations,
			ro_get_target_declarations( $attrs, $target, $attrs['responsiveStyles']['mobile'] ?? array() )
		);
	}

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

	// Strip WordPress preset classes that conflict with our responsive declarations.
	$all_declarations = array_merge( $desktop_declarations, $tablet_declarations, $mobile_declarations );
	$override_properties = array_unique( array_keys( $all_declarations ) );

	foreach ( $override_properties as $css_property ) {
		if ( 'background-color' === $css_property ) {
			$processor->remove_class( 'has-background' );
			// Remove has-*-background-color preset class.
			$class_attr = $processor->get_attribute( 'class' );
			if ( is_string( $class_attr ) && preg_match( '/has-[\w-]+-background-color/', $class_attr, $matches ) ) {
				$processor->remove_class( $matches[0] );
			}
		} elseif ( 'color' === $css_property ) {
			$processor->remove_class( 'has-text-color' );
			$class_attr = $processor->get_attribute( 'class' );
			if ( is_string( $class_attr ) && preg_match( '/has-[\w-]+-color(?!-)/', $class_attr, $matches ) ) {
				$processor->remove_class( $matches[0] );
			}
		} elseif ( false !== strpos( $css_property, 'border' ) && false !== strpos( $css_property, 'color' ) ) {
			$processor->remove_class( 'has-border-color' );
			$class_attr = $processor->get_attribute( 'class' );
			if ( is_string( $class_attr ) && preg_match( '/has-[\w-]+-border-color/', $class_attr, $matches ) ) {
				$processor->remove_class( $matches[0] );
			}
		}
	}

	// Strip inline styles that our responsive CSS will override.
	$existing_style = $processor->get_attribute( 'style' );
	if ( is_string( $existing_style ) ) {
		$properties_to_strip = array();
		
		// Collect properties to strip from all declarations
		foreach ( $override_properties as $css_property ) {
			// Convert CSS property to regex-safe format
			$properties_to_strip[] = preg_quote( $css_property, '/' );

			// If overriding border color variants, also strip shorthand properties
			// that can keep inline colors winning over stylesheet rules.
			if ( false !== strpos( $css_property, 'border' ) && false !== strpos( $css_property, 'color' ) ) {
				$properties_to_strip[] = 'border-color';
				$properties_to_strip[] = 'border';
			}
		}
		
		if ( ! empty( $properties_to_strip ) ) {
			$pattern = '/(?:' . implode( '|', $properties_to_strip ) . ')\s*:[^;]*;?/';
			$cleaned_style = preg_replace( $pattern, '', $existing_style );
			$cleaned_style = trim( $cleaned_style, ' ;' );
			
			if ( $cleaned_style ) {
				$processor->set_attribute( 'style', $cleaned_style );
			} else {
				$processor->remove_attribute( 'style' );
			}
		}
	}

	$updated_content = $processor->get_updated_html();
	$css_parts       = array();
	$breakpoints     = ro_get_responsive_breakpoints();

	// Desktop base rule.
	if ( ! empty( $desktop_declarations ) ) {
		$decl = '';
		foreach ( $desktop_declarations as $property => $value ) {
			$decl .= $property . ':' . $value . ' !important;';
		}
		$css_parts[] = '.' . $class_name . '{' . $decl . '}';
	}

	if ( ! empty( $tablet_declarations ) ) {
		$decl = '';
		foreach ( $tablet_declarations as $property => $value ) {
			$decl .= $property . ':' . $value . ' !important;';
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
			$decl .= $property . ':' . $value . ' !important;';
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