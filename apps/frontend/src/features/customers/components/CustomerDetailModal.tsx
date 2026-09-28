import Avatar from "../../../components/ui/avatar";
import Modal from "../../../components/ui/modal";
import StatTile from "../../../components/ui/stat-tile";
import { formatDate } from "../../../libs/format";
import type { Customer } from "../api";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	customer: Customer | null;
}

export default function CustomerDetailModal({
	open,
	onOpenChange,
	customer,
}: Props) {
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Customer Detail"
			description={customer?.name}
			size="sm"
		>
			{open && customer ? (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center gap-2 text-center">
						<Avatar
							name={customer.name}
							size="xl"
						/>
						<div>
							<p className="text-sm font-bold text-text-h">{customer.name}</p>
							<p className="text-xs text-text">{customer.phone || "—"}</p>
							<p
								className="truncate text-3xs text-text"
								title={customer.id}
							>
								{customer.id}
							</p>
						</div>
					</div>
					<div className="border-t border-base-border" />
					<div className="grid grid-cols-2 gap-2">
						<StatTile
							label="Phone"
							value={customer.phone || "—"}
						/>
						<StatTile
							label="Joined"
							value={formatDate(customer.createdAt)}
						/>
					</div>
				</div>
			) : null}
		</Modal>
	);
}
