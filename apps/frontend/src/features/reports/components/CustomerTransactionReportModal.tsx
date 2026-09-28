import {
	FileDownIcon,
	Loader2,
	RefreshCwIcon,
	RotateCcwIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../../../components/ui/button";
import DatePicker from "../../../components/ui/date-picker";
import ErrorBanner from "../../../components/ui/error-banner";
import Eyebrow from "../../../components/ui/eyebrow";
import FilterPills from "../../../components/ui/filter-pills";
import Modal from "../../../components/ui/modal";
import StatCard, { StatGrid } from "../../../components/ui/stat-card";
import { useServerPagination } from "../../../hooks/usePagination";
import {
	monthEnd,
	monthRangeLabel,
	monthStart,
} from "../../inventories/format";
import type { CustomerDetailView } from "../api";
import { formatCurrency } from "../format";
import { useCustomerDetailReport } from "../hooks/useCustomerDetailReport";
import { downloadCustomerReportPdf } from "../pdf/customerReportPdf";
import { loadCustomerReportPdfData } from "../pdf/loadCustomerReport";
import CustomerReportTable from "./CustomerReportTable";

export interface CustomerTransactionReportTarget {
	id: string;
	name: string;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	customer: CustomerTransactionReportTarget | null;
	generatedBy?: string;
	onNotify?: (message: string, variant?: "success" | "error") => void;
}

const PAGE_SIZE = 8;

const VIEW_OPTIONS: { label: string; value: CustomerDetailView }[] = [
	{ label: "Transactions", value: "transactions" },
	{ label: "Products", value: "products" },
	{ label: "Cashiers", value: "cashiers" },
];

export default function CustomerTransactionReportModal({
	open,
	onOpenChange,
	customer,
	generatedBy = "Admin",
	onNotify,
}: Props) {
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Transaction Report"
			description={customer?.name}
			size="5xl"
		>
			{open && customer ? (
				<ReportContent
					customer={customer}
					generatedBy={generatedBy}
					onNotify={onNotify}
				/>
			) : null}
		</Modal>
	);
}

function ReportContent({
	customer,
	generatedBy,
	onNotify,
}: {
	customer: CustomerTransactionReportTarget;
	generatedBy: string;
	onNotify?: (message: string, variant?: "success" | "error") => void;
}) {
	const [view, setView] = useState<CustomerDetailView>("transactions");
	const [fromMonth, setFromMonth] = useState("");
	const [toMonth, setToMonth] = useState("");
	const [page, setPage] = useState(0);
	const [exporting, setExporting] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [view, fromMonth, toMonth, customer.id]);

	const {
		report,
		meta,
		loading,
		error: fetchError,
		fetchReport,
	} = useCustomerDetailReport({
		customerId: customer.id,
		view,
		fromMonth,
		toMonth,
		page,
		pageSize: PAGE_SIZE,
	});

	const {
		totalItems,
		totalPages,
		page: safePage,
	} = useServerPagination(meta ?? undefined);

	const summary = report?.summary;
	const rows =
		view === "transactions"
			? (report?.transactions ?? [])
			: view === "products"
				? (report?.products ?? [])
				: (report?.cashiers ?? []);

	const handleExport = async () => {
		setExporting(true);
		setExportError(null);
		try {
			const data = await loadCustomerReportPdfData({
				customerId: customer.id,
				customerName: customer.name,
				view,
				from: monthStart(fromMonth),
				to: monthEnd(toMonth),
				rangeLabel: monthRangeLabel(fromMonth, toMonth),
				generatedBy,
			});
			await downloadCustomerReportPdf(data, data.fileName);
			onNotify?.(`PDF "${data.fileName}" berhasil dibuat.`);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Gagal membuat PDF";
			setExportError(message);
			onNotify?.(message, "error");
		} finally {
			setExporting(false);
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<FilterPills
					variant="segmented"
					label="Report view"
					items={VIEW_OPTIONS}
					value={view}
					onValueChange={(value) => setView(value)}
				/>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={fetchReport}
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
						onClick={handleExport}
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
						label="Filter report from month"
						value={fromMonth}
						onValueChange={setFromMonth}
						size="sm"
						className="w-full min-w-0"
						placeholder="All months"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Eyebrow>To month</Eyebrow>
					<DatePicker
						label="Filter report to month"
						value={toMonth}
						onValueChange={setToMonth}
						size="sm"
						className="w-full min-w-0"
						placeholder="All months"
					/>
				</div>
				<div className="flex items-end">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setFromMonth("");
							setToMonth("");
						}}
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

			{fetchError && (
				<ErrorBanner
					size="sm"
					message={fetchError}
					onRetry={fetchReport}
				/>
			)}

			<StatGrid className="lg:grid-cols-4">
				<StatCard
					loading={loading}
					label="Transactions"
					value={summary?.transaction_count ?? 0}
					note={
						summary?.last_transaction_at
							? `Last ${new Date(summary.last_transaction_at).toLocaleDateString("en-GB")}`
							: "No transactions"
					}
				/>
				<StatCard
					loading={loading}
					label="Gross Sales"
					value={formatCurrency(summary?.gross_sales)}
					note="Sebelum diskon & pajak"
				/>
				<StatCard
					loading={loading}
					label="Total Sales"
					value={formatCurrency(summary?.total_sales)}
					note="Setelah diskon & pajak"
				/>
				<StatCard
					loading={loading}
					label="Period"
					value={monthRangeLabel(fromMonth, toMonth) ?? "All time"}
					note="Rentang tanggal filter"
				/>
			</StatGrid>

			<CustomerReportTable
				view={view}
				loading={loading}
				rows={rows}
				pageCount={totalPages}
				safePage={safePage}
				onPageChange={setPage}
				totalLabel={`Showing ${rows.length} of ${totalItems} rows`}
			/>
		</div>
	);
}
