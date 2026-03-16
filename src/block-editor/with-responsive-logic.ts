import React from 'react';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { clone, encodePathKey, isObject } from '../utils';
import { getActiveTargets } from './target-discovery';

const getTargetsForBlock = ( blockName: string ): ResponsiveTarget[] =>
	( getActiveTargets() as ResponsiveTarget[] ).filter( ( target: ResponsiveTarget ) => target.block === blockName );

const getValueAtPath = ( object: Record<string, any>, path: string ): any => {
	if ( ! object || ! path ) {
		return undefined;
	}
	return path.split( '.' ).reduce( ( acc: any, segment: string ) => {
		if ( acc === undefined || acc === null ) {
			return undefined;
		}
		return acc[ segment ];
	}, object );
};

const setValueAtPath = ( object: Record<string, any>, path: string, value: any ): Record<string, any> => {
	if ( ! path ) {
		return object;
	}
	const segments = path.split( '.' );
	let cursor: Record<string, any> = object;
	segments.forEach( ( segment: string, index: number ) => {
		if ( index === segments.length - 1 ) {
			if ( isObject( cursor[ segment ] ) && isObject( value ) ) {
				cursor[ segment ] = { ...cursor[ segment ], ...value };
			} else {
				cursor[ segment ] = value;
			}
			return;
		}
		if ( ! isObject( cursor[ segment ] ) ) {
			cursor[ segment ] = {};
		}
		cursor = cursor[ segment ];
	} );
	return object;
};

const setResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget,
	value: any
): Record<string, any> => {
	const nextResponsiveStyles = clone( attributes?.responsiveStyles || {} );
	if ( ! isObject( nextResponsiveStyles[ device ] ) ) {
		nextResponsiveStyles[ device ] = {};
	}
	const pathKey = encodePathKey( target.path );
	if ( target.valueKind === 'object' && isObject( value ) ) {
		const existingValue = isObject( nextResponsiveStyles[ device ][ pathKey ] )
			? nextResponsiveStyles[ device ][ pathKey ]
			: {};
		const nextValue = { ...existingValue };
		if ( Array.isArray( target.leafKeys ) && target.leafKeys.length ) {
			target.leafKeys.forEach( ( key: string ) => {
				if ( Object.prototype.hasOwnProperty.call( value, key ) ) {
					nextValue[ key ] = clone( value[ key ] );
				}
			} );
		} else {
			Object.assign( nextValue, clone( value ) );
		}
		nextResponsiveStyles[ device ][ pathKey ] = nextValue;
	} else {
		nextResponsiveStyles[ device ][ pathKey ] = clone( value );
	}
	return nextResponsiveStyles;
};

const getResponsiveValue = (
	attributes: Record<string, any>,
	device: string,
	target: ResponsiveTarget
): any => {
	const payload = attributes?.responsiveStyles?.[ device ];
	if ( ! isObject( payload ) ) {
		return undefined;
	}
	const pathKey = encodePathKey( target.path );
	if ( payload[ pathKey ] !== undefined ) {
		return payload[ pathKey ];
	}
	return undefined;
};

export const withResponsiveLogic = createHigherOrderComponent( ( BlockEdit: any ) => {
	return ( props: any ) => {
		const targets = getTargetsForBlock( props.name );
		if ( ! targets.length ) {
			return React.createElement( BlockEdit, props );
		}

		const { setAttributes, attributes } = props;
		const deviceType = useSelect(
			( select ) => ( select( 'core/editor' ) as any ).getDeviceType?.() || 'Desktop',
			[]
		);
		const device = ( ( deviceType as string ) || 'Desktop' ).toLowerCase();
		const prevDeviceRef = useRef( device );
		const isSyncingRef = useRef( false );
		const attrsRef = useRef( attributes );
		const didMountRef = useRef( false );
		attrsRef.current = attributes;

		useEffect( () => {
			if ( didMountRef.current ) {
				return;
			}
			didMountRef.current = true;

			const nextAttributes = clone( attrsRef.current );
			let nextResponsiveStyles = clone( attrsRef.current?.responsiveStyles || {} );
			let needsUpdate = false;

			targets.forEach( ( target ) => {
				const desktopValue = getResponsiveValue( { responsiveStyles: nextResponsiveStyles }, 'desktop', target );
				if ( desktopValue === undefined ) {
					const liveValue = getValueAtPath( attrsRef.current, target.path );
					if ( liveValue !== undefined ) {
						nextResponsiveStyles = setResponsiveValue( { responsiveStyles: nextResponsiveStyles }, 'desktop', target, liveValue );
						needsUpdate = true;
					}
					return;
				}

				setValueAtPath( nextAttributes, target.path, clone( desktopValue ) );
				needsUpdate = true;
			} );

			if ( needsUpdate ) {
				nextAttributes.responsiveStyles = nextResponsiveStyles;
				isSyncingRef.current = true;
				setAttributes( nextAttributes );
				requestAnimationFrame( () => {
					isSyncingRef.current = false;
				} );
			}
		}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

		useEffect( () => {
			if ( prevDeviceRef.current === device ) {
				return;
			}

			const previousDevice = prevDeviceRef.current;
			prevDeviceRef.current = device;

			let nextResponsiveStyles = clone( attrsRef.current?.responsiveStyles || {} );

			targets.forEach( ( target ) => {
				const liveValue = getValueAtPath( attrsRef.current, target.path );
				if ( liveValue !== undefined ) {
					nextResponsiveStyles = setResponsiveValue( { responsiveStyles: nextResponsiveStyles }, previousDevice, target, liveValue );
				}
			} );

			const nextAttributes = clone( attrsRef.current );

			targets.forEach( ( target ) => {
				const currentDeviceValue = getResponsiveValue( { responsiveStyles: nextResponsiveStyles }, device, target );
				if ( currentDeviceValue !== undefined ) {
					setValueAtPath( nextAttributes, target.path, clone( currentDeviceValue ) );
				}
			} );

			nextAttributes.responsiveStyles = nextResponsiveStyles;

			isSyncingRef.current = true;
			setAttributes( nextAttributes );
			requestAnimationFrame( () => {
				isSyncingRef.current = false;
			} );
		}, [ device ] ); // eslint-disable-line react-hooks/exhaustive-deps

		const interceptedSetAttributes = ( newAttrs: Record<string, any> ) => {
			if ( isSyncingRef.current ) {
				setAttributes( newAttrs );
				return;
			}

			let nextResponsiveStyles = clone( attrsRef.current?.responsiveStyles || {} );
			let hasResponsiveChange = false;

			targets.forEach( ( target ) => {
				const incomingValue = getValueAtPath( newAttrs, target.path );
				if ( incomingValue === undefined ) {
					return;
				}

				const currentValue = getValueAtPath( attrsRef.current, target.path );
				if ( JSON.stringify( incomingValue ) === JSON.stringify( currentValue ) ) {
					return;
				}

				hasResponsiveChange = true;
				nextResponsiveStyles = setResponsiveValue( { responsiveStyles: nextResponsiveStyles }, device, target, incomingValue );
			} );

			if ( ! hasResponsiveChange ) {
				setAttributes( newAttrs );
				return;
			}

			setAttributes( {
				...newAttrs,
				responsiveStyles: nextResponsiveStyles,
			} );
		};

		return React.createElement( BlockEdit, { ...props, setAttributes: interceptedSetAttributes } );
	};
}, 'withResponsiveLogic' );