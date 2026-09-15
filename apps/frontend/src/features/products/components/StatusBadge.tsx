import Badge from "../../../components/ui/badge";
import { STATUS_DOT } from "../format";

export default function StatusBadge({ isActive }: { isActive: boolean }) {
	const label = isActive ? "Active" : "Inactive";
	return (
		<Badge
			variant="neutral"
			size="sm"
			className="gap-1.5"
		>
			<span
				className="size-1.5 shrink-0 rounded-full"
				style={{ backgroundColor: STATUS_DOT[label] }}
				aria-hidden
			/>
			{label}
		</Badge>
	);
}
