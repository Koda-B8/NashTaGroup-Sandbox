import StatusBadge from "../../../components/ui/status-badge";
import type { MovementSource } from "../api";
import { MOVEMENT_SOURCE_LABEL } from "../format";

export default function MovementSourceBadge({
	source,
}: {
	source: MovementSource;
}) {
	return (
		<StatusBadge
			label={MOVEMENT_SOURCE_LABEL[source]}
			variant={source === "checkout" ? "primary" : "neutral"}
		/>
	);
}
