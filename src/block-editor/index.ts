import { addFilter } from "@wordpress/hooks";
import { registerPlugin } from "@wordpress/plugins";
import { ResponsiveTargetsModal } from "./responsive-targets-modal";
import { withResponsiveLogic } from "./with-responsive-logic";

registerPlugin("responsive-overrides-settings", {
	render: ResponsiveTargetsModal,
});
addFilter(
	"editor.BlockEdit",
	"responsive-overrides/interceptor",
	withResponsiveLogic,
);
