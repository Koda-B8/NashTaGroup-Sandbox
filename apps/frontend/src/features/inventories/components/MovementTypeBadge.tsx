import StatusBadge from "../../../components/ui/status-badge";
import type { MovementType } from "../api";
import { MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_TONE } from "../format";

export default function MovementTypeBadge({ type }: { type: MovementType }) {
	const tone = MOVEMENT_TYPE_TONE[type];
	return (
		<StatusBadge
			label={MOVEMENT_TYPE_LABEL[type]}
			variant={tone.variant}
			dotColor={tone.dot}
		/>
	);
}
