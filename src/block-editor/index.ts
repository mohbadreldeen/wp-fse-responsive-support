import { addFilter } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';
import { ResponsiveTargetsModal } from './responsive-targets-modal';
import { withResponsiveLogic } from './with-responsive-logic';
import { withResponsivePreview } from './with-responsive-preview';

registerPlugin( 'responsive-overrides-settings', {render: ResponsiveTargetsModal} );
addFilter( 'editor.BlockEdit', 'responsive-overrides/interceptor', withResponsiveLogic );
addFilter( 'editor.BlockListBlock', 'responsive-overrides/previewer', withResponsivePreview );