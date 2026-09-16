import Badge from "../../../components/ui/badge";
import { statusDot, statusLabel, statusVariant } from "../format";

export default function TransactionStatusBadge({ status }: { status: string }) {
	return (
		<Badge
			variant={statusVariant(status)}
			size="sm"
			className="gap-1.5"
		>
			<span
				className="size-1.5 shrink-0 rounded-full"
				style={{ backgroundColor: statusDot(status) }}
				aria-hidden
			/>
			{statusLabel(status)}
		</Badge>
	);
}
