import { clone, normalizePath, getMapperForPath,isObject } from '../utils';
const DEVICE_KEYS = [ 'desktop', 'tablet', 'mobile' ];
const DEFAULT_TARGETS:string[] = [];

const runtimeSettings = ( window as Window & {
	responsiveOverridesSettings?: Record<string, any>;
} )?.responsiveOverridesSettings || {};

export const normalizeTargets = ( rawTargets : any) => {
	if ( ! Array.isArray( rawTargets ) || ! rawTargets.length ) {
		return clone( DEFAULT_TARGETS );
	}

	// Generic object paths that should never be targets (too broad)
	const FORBIDDEN_PATHS = [ 'style' ];

	return rawTargets
		.filter( ( target ) => {
			if ( ! target?.block || ! target?.path ) {
				return false;
			}

			const normalizedPath = normalizePath( target.path );
			if ( ! normalizedPath ) {
				return false;
			}

			// Reject generic object paths
			if ( FORBIDDEN_PATHS.includes( normalizedPath.toLowerCase() ) ) {
				if ( window.console && window.console.warn ) {
					window.console.warn( '[RO] Rejecting generic target path:', normalizedPath, 'for block:', target.block );
				}
				return false;
			}

			return true;
		} )
		.map( ( target ) => {
			const normalized = {
				block: String( target.block ),
				path: normalizePath( target.path ),
				valueKind: target.valueKind === 'scalar' ? 'scalar' : 'object',
				leafKeys: Array.isArray( target.leafKeys ) ? target.leafKeys.map( String ) : [],
				mapper: target.mapper ? String( target.mapper ) : '',
			};

			if ( ! normalized.mapper ) {
				normalized.mapper = getMapperForPath( normalized.path );
			}

			return normalized;
		} );
};

const detectValueKind = ( value: any ) => {
	if ( isObject( value ) ) {
		return 'object';
	}
	if ( typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ) {
		return 'scalar';
	}
	return null;
};

export const listAttributeCandidates = ( attributes: Record<string, any>, pathPrefix = '', depth = 0 ) => {
	if ( ! isObject( attributes ) || depth > 4 ) {
		return [];
	}

	const candidates = [];
	const hiddenAttributes = [ 'tagName', 'templateLock', 'metadata', 'allowedBlocks', 'ariaLabel' ];
	const forbiddenPaths = new Set( [ 'style' ] );
	const duplicateAliasPaths = new Set( [ 'backgroundColor', 'textColor' ] );

	// Always include well-known style paths regardless of schema discovery
	if ( depth === 0 && ! pathPrefix ) {
		candidates.push(
			{
				path: 'style.spacing.padding',
				valueKind: 'object',
				leafKeys: [ 'top', 'right', 'bottom', 'left' ],
				mapper: 'spacingPadding',
			},
			{
				path: 'style.spacing.margin',
				valueKind: 'object',
				leafKeys: [ 'top', 'right', 'bottom', 'left' ],
				mapper: 'spacingMargin',
			},
			{
				path: 'style.color.text',
				valueKind: 'scalar',
				leafKeys: [],
				mapper: 'textColor',
			},
			{
				path: 'style.color.background',
				valueKind: 'scalar',
				leafKeys: [],
				mapper: 'backgroundColor',
			}
		);
	}

	Object.entries( attributes ).forEach( ( [ attrName, schema ] ) => {
		const path = pathPrefix ? `${ pathPrefix }.${ attrName }` : attrName;
		const type = schema?.type;

		// Skip internal/control attributes at top level
		if ( depth === 0 && attrName === 'responsiveStyles' ) {
			return;
		}

		if ( depth === 0 && hiddenAttributes.includes( attrName ) ) {
			return;
		}

		// Hide legacy aliases when canonical style.color.* paths are available.
		if ( depth === 0 && duplicateAliasPaths.has( path ) ) {
			return;
		}

		if ( type === 'object' && isObject( schema?.properties ) ) {
			if ( ! forbiddenPaths.has( path ) ) {
				const leafKeys = Object.entries( schema.properties )
					.filter( ( [ , childSchema ]: [string, any] ) => {
						const childType = childSchema?.type;
						return childType === 'string' || childType === 'number' || childType === 'boolean';
					} )
					.map( ( [ key ] ) => key );

				candidates.push( {
					path,
					valueKind: 'object',
					leafKeys,
					mapper: getMapperForPath( path ),
				} );
			}

			candidates.push( ...listAttributeCandidates( schema.properties, path, depth + 1 ) );
			return;
		}

		const valueKind = detectValueKind( schema?.default ) || ( type === 'object' ? 'object' : 'scalar' );
		if ( ! valueKind ) {
			return;
		}

		// Skip generic object-type attributes without explicit mappers
		// to prevent selecting overly broad paths like "style"
		if ( valueKind === 'object' || forbiddenPaths.has( path ) ) {
			return;
		}

		candidates.push( {
			path,
			valueKind,
			leafKeys: [],
			mapper: '',
		} );
	} );

	// Deduplicate by path
	const seen = new Set();
	return candidates.filter( ( candidate ) => {
		if ( seen.has( candidate.path ) ) {
			return false;
		}
		seen.add( candidate.path );
		return true;
	} );
};

export let activeTargets = normalizeTargets( runtimeSettings?.config?.targets );

export const getActiveTargets = () => activeTargets;

export const setActiveTargets = ( rawTargets: unknown[] ) => {
	activeTargets = normalizeTargets( rawTargets );
	return activeTargets;
};
