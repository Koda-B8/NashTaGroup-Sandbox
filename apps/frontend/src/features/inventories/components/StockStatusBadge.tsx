import UiStatusBadge from "../../../components/ui/status-badge";
import type { StockStatus } from "../api";
import { STOCK_STATUS_LABEL, STOCK_STATUS_TONE } from "../format";

export default function StockStatusBadge({ status }: { status: StockStatus }) {
	const tone = STOCK_STATUS_TONE[status];
	return (
		<UiStatusBadge
			label={STOCK_STATUS_LABEL[status]}
			variant={tone.variant}
			dotColor={tone.dot}
		/>
	);
}
