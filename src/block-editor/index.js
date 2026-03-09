import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useRef, useEffect } from '@wordpress/element';

const TARGET_BLOCK = 'core/group';

const isObject = ( v ) => v && typeof v === 'object' && ! Array.isArray( v );
const clone = ( v ) => ( isObject( v ) ? JSON.parse( JSON.stringify( v ) ) : v );

/**
 * Get the padding object from attributes (e.g. { top: "20px", left: "10px" }).
 */
const getPadding = ( attributes ) => {
	const p = attributes?.style?.spacing?.padding;
	return isObject( p ) ? p : {};
};

/**
 * Get stored responsive padding for a device from responsiveStyles.
 */
const getDevicePadding = ( attributes, device ) => {
	const p = attributes?.responsiveStyles?.[ device ]?.padding;
	return isObject( p ) ? p : {};
};

/**
 * Build an updated responsiveStyles object with new padding for a device.
 */
const setDevicePadding = ( attributes, device, padding ) => {
	const rs = clone( attributes?.responsiveStyles || {} );
	if ( ! isObject( rs[ device ] ) ) {
		rs[ device ] = {};
	}
	rs[ device ].padding = { ...( rs[ device ].padding || {} ), ...padding };
	return rs;
};

/**
 * Build a style object with replaced padding.
 */
const buildStyleWithPadding = ( attributes, padding ) => {
	const s = clone( attributes?.style || {} );
	if ( ! isObject( s.spacing ) ) {
		s.spacing = {};
	}
	s.spacing.padding = padding;
	return s;
};

// ── editor.BlockEdit: intercept setAttributes + swap on device switch ──

const withResponsiveLogic = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( props.name !== TARGET_BLOCK ) {
			return <BlockEdit { ...props } />;
		}

		const { setAttributes, attributes } = props;
		const deviceType = useSelect(
			( select ) => select( 'core/editor' ).getDeviceType(),
			[]
		);
		const device = ( deviceType || 'Desktop' ).toLowerCase();

		// Refs to track previous device and prevent infinite loops.
		const prevDeviceRef = useRef( device );
		const isSyncing = useRef( false );
		const attrsRef = useRef( attributes );
		attrsRef.current = attributes;
		const didMount = useRef( false );

		// On mount, restore desktop padding from responsiveStyles if saved
		// while on a different device.
		useEffect( () => {
			if ( didMount.current ) {
				return;
			}
			didMount.current = true;

			const a = attrsRef.current;
			const desktopPadding = a?.responsiveStyles?.desktop?.padding;
			if ( ! isObject( desktopPadding ) || ! Object.keys( desktopPadding ).length ) {
				return;
			}

			const livePadding = getPadding( a );
			if ( JSON.stringify( livePadding ) === JSON.stringify( desktopPadding ) ) {
				return;
			}

			isSyncing.current = true;
			setAttributes( { style: buildStyleWithPadding( a, clone( desktopPadding ) ) } );
			requestAnimationFrame( () => {
				isSyncing.current = false;
			} );
		}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

		// When the device changes, swap padding in the store.
		useEffect( () => {
			if ( prevDeviceRef.current === device ) {
				return;
			}

			const prev = prevDeviceRef.current;
			prevDeviceRef.current = device;
			isSyncing.current = true;

			const currentAttrs = attrsRef.current;

			// 1. Save current live padding into responsiveStyles for the *previous* device.
			const livePadding = getPadding( currentAttrs );
			let nextRS = setDevicePadding( currentAttrs, prev, livePadding );

			// 2. Also persist the nextRS update for the previous device.
			// 3. Load the new device's stored padding into style.spacing.padding.
			const newPadding = nextRS[ device ]?.padding;
			const nextStyle = buildStyleWithPadding(
				currentAttrs,
				isObject( newPadding ) && Object.keys( newPadding ).length
					? clone( newPadding )
					: clone( livePadding )
			);

			setAttributes( { responsiveStyles: nextRS, style: nextStyle } );

			// Reset syncing flag after React processes the update.
			requestAnimationFrame( () => {
				isSyncing.current = false;
			} );
		}, [ device ] ); // eslint-disable-line react-hooks/exhaustive-deps

		// Intercept setAttributes: on tablet/mobile, also mirror padding into responsiveStyles.
		const interceptedSetAttributes = ( newAttrs ) => {
			// During our own sync, pass through untouched.
			if ( isSyncing.current ) {
				setAttributes( newAttrs );
				return;
			}

			// Check if this update touches padding.
			const incomingPadding = newAttrs?.style?.spacing?.padding;
			const hasPaddingChange = isObject( incomingPadding );

			if ( device === 'desktop' ) {
				if ( hasPaddingChange ) {
					// Also mirror into responsiveStyles.desktop
					const merged = { ...getPadding( attributes ), ...incomingPadding };
					newAttrs = {
						...newAttrs,
						responsiveStyles: setDevicePadding( attributes, 'desktop', merged ),
					};
				}
				setAttributes( newAttrs );
				return;
			}

			// Tablet / Mobile
			if ( hasPaddingChange ) {
				const merged = { ...getDevicePadding( attributes, device ), ...incomingPadding };
				newAttrs = {
					...newAttrs,
					responsiveStyles: setDevicePadding( attributes, device, merged ),
				};
			}

			setAttributes( newAttrs );
		};

		return <BlockEdit { ...props } setAttributes={ interceptedSetAttributes } />;
	};
}, 'withResponsiveLogic' );

addFilter( 'editor.BlockEdit', 'responsive-overrides/interceptor', withResponsiveLogic );

// ── editor.BlockListBlock: preview responsive padding in canvas ──

const withPreviewStyles = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		if ( props.name !== TARGET_BLOCK ) {
			return <BlockListBlock { ...props } />;
		}

		const deviceType = useSelect(
			( select ) => select( 'core/editor' ).getDeviceType(),
			[]
		);
		const device = ( deviceType || 'Desktop' ).toLowerCase();

		if ( device === 'desktop' ) {
			return <BlockListBlock { ...props } />;
		}

		const padding = getDevicePadding( props.attributes, device );
		if ( ! Object.keys( padding ).length ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockListBlock
				{ ...props }
				wrapperProps={ {
					style: {
						paddingTop: padding.top,
						paddingRight: padding.right,
						paddingBottom: padding.bottom,
						paddingLeft: padding.left,
					},
				} }
			/>
		);
	};
}, 'withPreviewStyles' );

addFilter( 'editor.BlockListBlock', 'responsive-overrides/previewer', withPreviewStyles );