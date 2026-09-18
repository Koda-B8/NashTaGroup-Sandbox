import StatusBadge from "../../../components/ui/status-badge";
import { statusDot, statusLabel, statusVariant } from "../format";

export default function TransactionStatusBadge({ status }: { status: string }) {
	return (
		<StatusBadge
			label={statusLabel(status)}
			dotColor={statusDot(status)}
			variant={statusVariant(status)}
		/>
	);
}
