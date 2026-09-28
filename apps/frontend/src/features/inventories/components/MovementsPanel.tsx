import {
	FileDownIcon,
	Loader2,
	RefreshCwIcon,
	RotateCcwIcon,
} from "lucide-react";

import PaginationControls from "../../../components/PaginationControls";
import Button from "../../../components/ui/button";
import DatePicker from "../../../components/ui/date-picker";
import EmptyState from "../../../components/ui/empty-state";
import ErrorBanner from "../../../components/ui/error-banner";
import Eyebrow from "../../../components/ui/eyebrow";
import FilterPills from "../../../components/ui/filter-pills";
import type { InventoryMovement } from "../api";
import {
	formatDateTime,
	formatMovementQuantity,
	MOVEMENT_TYPE_OPTIONS,
	MOVEMENT_TYPE_TEXT,
	type MovementTypeFilter,
} from "../format";
import MovementSourceBadge from "./MovementSourceBadge";
import MovementTypeBadge from "./MovementTypeBadge";

interface Props {
	loading: boolean;
	error: string | null;
	onRetry: () => void;
	paged: InventoryMovement[];
	totalItems: number;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	showVariant?: boolean;
	typeFilter: MovementTypeFilter;
	onTypeFilterChange: (value: MovementTypeFilter) => void;
	fromMonth: string;
	toMonth: string;
	onFromMonthChange: (value: string) => void;
	onToMonthChange: (value: string) => void;
	onReset: () => void;
	exporting: boolean;
	exportError: string | null;
	onExport: () => void;
}

export default function MovementsPanel({
	loading,
	error,
	onRetry,
	paged,
	totalItems,
	pageCount,
	safePage,
	onPageChange,
	showVariant = false,
	typeFilter,
	onTypeFilterChange,
	fromMonth,
	toMonth,
	onFromMonthChange,
	onToMonthChange,
	onReset,
	exporting,
	exportError,
	onExport,
}: Props) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<FilterPills
					variant="segmented"
					label="Filter by movement type"
					items={MOVEMENT_TYPE_OPTIONS}
					value={typeFilter}
					onValueChange={onTypeFilterChange}
				/>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onRetry}
						disabled={loading || exporting}
					>
						<RefreshCwIcon
							size={14}
							className={loading ? "animate-spin" : ""}
						/>
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={onExport}
						disabled={exporting}
					>
						{exporting ? (
							<Loader2
								size={14}
								className="animate-spin"
							/>
						) : (
							<FileDownIcon size={14} />
						)}
						{exporting ? "Menyiapkan..." : "Export PDF"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
				<div className="flex flex-col gap-1">
					<Eyebrow>From month</Eyebrow>
					<DatePicker
						label="Filter movements from month"
						value={fromMonth}
						onValueChange={onFromMonthChange}
						size="sm"
						className="w-full min-w-0"
						placeholder="All months"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Eyebrow>To month</Eyebrow>
					<DatePicker
						label="Filter movements to month"
						value={toMonth}
						onValueChange={onToMonthChange}
						size="sm"
						className="w-full min-w-0"
						placeholder="All months"
					/>
				</div>
				<div className="flex items-end">
					<Button
						variant="ghost"
						size="sm"
						onClick={onReset}
						disabled={!fromMonth && !toMonth}
						block
					>
						<RotateCcwIcon size={14} />
						Reset
					</Button>
				</div>
			</div>

			{exportError && (
				<ErrorBanner
					size="sm"
					message={exportError}
				/>
			)}

			{error && (
				<ErrorBanner
					size="sm"
					message={error}
					onRetry={onRetry}
				/>
			)}

			{loading ? (
				<p className="py-8 text-center text-xs text-text">
					Memuat riwayat stok...
				</p>
			) : paged.length === 0 ? (
				<EmptyState>Belum ada pergerakan stok untuk item ini.</EmptyState>
			) : (
				<ul className="flex flex-col divide-y divide-base-border rounded-lg border border-base-border">
					{paged.map((movement) => (
						<li
							key={movement.id}
							className="flex items-start justify-between gap-3 px-3 py-3"
						>
							<div className="flex min-w-0 flex-col gap-1">
								{showVariant && (
									<span className="truncate text-2xs font-medium text-text-h">
										{movement.productItem.variantName ||
											movement.productItem.productCode ||
											"—"}
									</span>
								)}
								<div className="flex flex-wrap items-center gap-1.5">
									<MovementTypeBadge type={movement.type} />
									<span
										className={`text-sm font-semibold ${MOVEMENT_TYPE_TEXT[movement.type]}`}
									>
										{formatMovementQuantity(movement.type, movement.quantity)}
									</span>
									<MovementSourceBadge source={movement.source} />
								</div>
								<span className="text-2xs text-text">
									Stock{" "}
									<span className="font-medium text-text-h">
										{movement.stockBefore}
									</span>
									<span aria-hidden> → </span>
									<span className="font-medium text-text-h">
										{movement.stockAfter}
									</span>
									{movement.performedBy
										? ` · ${movement.performedBy.fullname}`
										: ""}
									{movement.transaction
										? ` · ${movement.transaction.transactionNumber}`
										: ""}
								</span>
								{movement.note && (
									<span className="text-2xs text-text">
										Note: {movement.note}
									</span>
								)}
							</div>
							<span className="shrink-0 text-2xs whitespace-nowrap text-text">
								{formatDateTime(movement.createdAt)}
							</span>
						</li>
					))}
				</ul>
			)}

			{!loading && paged.length > 0 && (
				<PaginationControls
					totalLabel={`Showing ${paged.length} of ${totalItems} movements`}
					pageCount={pageCount}
					safePage={safePage}
					onPageChange={onPageChange}
				/>
			)}
		</div>
	);
}
