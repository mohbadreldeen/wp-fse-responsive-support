import React from 'react';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { camelToKebab, cssPropToJsProp, isObject, encodePathKey, normalizePath } from '../utils';
import { getActiveTargets } from './target-discovery';
import { getResponsiveValue } from '../utils';

const getTargetsForBlock = ( blockName: string ): ResponsiveTarget[] =>
	( getActiveTargets() as ResponsiveTarget[] ).filter( ( t: ResponsiveTarget ) => t.block === blockName );

const getCssPropertyForPath = ( path: string ): string => {
	const normalizedPath = normalizePath( path );
	if ( ! normalizedPath || normalizedPath === 'style' ) {
		return '';
	}

	const segments = normalizedPath.split( '.' );
	const leaf = segments[ segments.length - 1 ];

	if ( segments[ 0 ] !== 'style' ) {
		return camelToKebab( leaf );
	}

	const namespace = segments[ 1 ] || '';

	if ( namespace === 'color' ) {
		if ( leaf === 'text' ) {
			return 'color';
		}
		if ( leaf === 'background' ) {
			return 'background-color';
		}
	}

	if ( namespace === 'spacing' && leaf === 'blockGap' ) {
		return 'gap';
	}

	if ( namespace === 'dimensions' ) {
		if ( leaf === 'minHeight' ) {
			return 'min-height';
		}
		if ( leaf === 'aspectRatio' ) {
			return 'aspect-ratio';
		}
	}

	return camelToKebab( leaf );
};

const setPreviewStyleValue = ( previewStyles: Record<string, any>, cssProperty: string, value: any ): void => {
	if ( ! cssProperty ) {
		return;
	}

	if ( typeof value !== 'string' && typeof value !== 'number' ) {
		return;
	}

	previewStyles[ cssPropToJsProp( cssProperty ) ] = value;
};


const applyObjectPreviewValue = ( previewStyles: Record<string, any>, target: any, responsiveValue: any ): void => {
	if ( ! isObject( responsiveValue ) ) {
		return;
	}

	const path = normalizePath( target.path );

	if ( path === 'style.spacing.padding' ) {
		setPreviewStyleValue( previewStyles, 'padding-top', responsiveValue.top );
		setPreviewStyleValue( previewStyles, 'padding-right', responsiveValue.right );
		setPreviewStyleValue( previewStyles, 'padding-bottom', responsiveValue.bottom );
		setPreviewStyleValue( previewStyles, 'padding-left', responsiveValue.left );
		return;
	}

	if ( path === 'style.spacing.margin' ) {
		setPreviewStyleValue( previewStyles, 'margin-top', responsiveValue.top );
		setPreviewStyleValue( previewStyles, 'margin-right', responsiveValue.right );
		setPreviewStyleValue( previewStyles, 'margin-bottom', responsiveValue.bottom );
		setPreviewStyleValue( previewStyles, 'margin-left', responsiveValue.left );
		return;
	}

	if ( path === 'style.border.radius' ) {
		setPreviewStyleValue( previewStyles, 'border-top-left-radius', responsiveValue.topLeft );
		setPreviewStyleValue( previewStyles, 'border-top-right-radius', responsiveValue.topRight );
		setPreviewStyleValue( previewStyles, 'border-bottom-right-radius', responsiveValue.bottomRight );
		setPreviewStyleValue( previewStyles, 'border-bottom-left-radius', responsiveValue.bottomLeft );
		return;
	}

	if ( path === 'style.border.width' ) {
		setPreviewStyleValue( previewStyles, 'border-top-width', responsiveValue.top );
		setPreviewStyleValue( previewStyles, 'border-right-width', responsiveValue.right );
		setPreviewStyleValue( previewStyles, 'border-bottom-width', responsiveValue.bottom );
		setPreviewStyleValue( previewStyles, 'border-left-width', responsiveValue.left );
		return;
	}

	const leafKeys = Array.isArray( target.leafKeys ) && target.leafKeys.length ? target.leafKeys : Object.keys( responsiveValue );
	leafKeys.forEach( ( leafKey: string ) => {
		if ( ! Object.prototype.hasOwnProperty.call( responsiveValue, leafKey ) ) {
			return;
		}

		const cssProperty = getCssPropertyForPath( `${ path }.${ leafKey }` );
		setPreviewStyleValue( previewStyles, cssProperty, responsiveValue[ leafKey ] );
	} );
};
export const withResponsivePreview = createHigherOrderComponent( ( BlockListBlock: any ) => {
	return ( props: any ) => {
		const targets = getTargetsForBlock( props.name );
		if ( ! targets.length ) {
			return React.createElement( BlockListBlock, props );
		}

		const deviceType = useSelect(
			( select ) => ( select( 'core/editor' ) as any ).getDeviceType?.() || 'Desktop',
			[]
		);
		const device = ( ( deviceType as string ) || 'Desktop' ).toLowerCase();

		if ( device === 'desktop' ) {
			return React.createElement( BlockListBlock, props );
		}

		const { attributes } = props;
		const previewStyles = {};

		targets.forEach( ( target: any ) => {
			const responsiveValue = getResponsiveValue( attributes, device, target );
			if ( responsiveValue === undefined ) {
				return;
			}

			const mapper = target.mapper || '';

			if ( mapper === 'spacingPadding' && isObject( responsiveValue ) ) {
				applyObjectPreviewValue( previewStyles, target, responsiveValue );
			} else if ( mapper === 'spacingMargin' && isObject( responsiveValue ) ) {
				applyObjectPreviewValue( previewStyles, target, responsiveValue );
			} else if ( mapper === 'textColor' && typeof responsiveValue === 'string' ) {
				setPreviewStyleValue( previewStyles, 'color', responsiveValue );
			} else if ( mapper === 'backgroundColor' && typeof responsiveValue === 'string' ) {
				setPreviewStyleValue( previewStyles, 'background-color', responsiveValue );
			} else if ( isObject( responsiveValue ) ) {
				applyObjectPreviewValue( previewStyles, target, responsiveValue );
			} else {
				const cssProperty = getCssPropertyForPath( target.path );
				setPreviewStyleValue( previewStyles, cssProperty, responsiveValue );
			}
		} );

		if ( ! Object.keys( previewStyles ).length ) {
			return React.createElement( BlockListBlock, props );
		}

		return React.createElement( BlockListBlock, {
			...props,
			wrapperProps: {
				...( props.wrapperProps || {} ),
				style: {
					...( props.wrapperProps?.style || {} ),
					...previewStyles,
				},
			},
		} );
	};
}, 'withResponsivePreview' );