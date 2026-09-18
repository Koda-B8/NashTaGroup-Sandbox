import UiStatusBadge from "../../../components/ui/status-badge";
import { STATUS_DOT } from "../format";

export default function StatusBadge({ isActive }: { isActive: boolean }) {
	const label = isActive ? "Active" : "Inactive";
	return (
		<UiStatusBadge
			label={label}
			dotColor={STATUS_DOT[label]}
		/>
	);
}
