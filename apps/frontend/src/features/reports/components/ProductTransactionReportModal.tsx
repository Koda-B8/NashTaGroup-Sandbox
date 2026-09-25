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
import type { ProductDetailView } from "../api";
import { formatCurrency } from "../format";
import { useProductDetailReport } from "../hooks/useProductDetailReport";
import { loadProductReportPdfData } from "../pdf/loadProductReport";
import { downloadProductReportPdf } from "../pdf/productReportPdf";
import ProductReportTable from "./ProductReportTable";

export interface ProductTransactionReportTarget {
	id: string;
	name: string;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product: ProductTransactionReportTarget | null;
	generatedBy?: string;
	onNotify?: (message: string, variant?: "success" | "error") => void;
}

const PAGE_SIZE = 8;

const VIEW_OPTIONS: { label: string; value: ProductDetailView }[] = [
	{ label: "Transactions", value: "transactions" },
	{ label: "Customers", value: "customers" },
	{ label: "Cashiers", value: "cashiers" },
];

export default function ProductTransactionReportModal({
	open,
	onOpenChange,
	product,
	generatedBy = "Admin",
	onNotify,
}: Props) {
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Transaction Report"
			description={product?.name}
			size="5xl"
		>
			{open && product ? (
				<ReportContent
					product={product}
					generatedBy={generatedBy}
					onNotify={onNotify}
				/>
			) : null}
		</Modal>
	);
}

function ReportContent({
	product,
	generatedBy,
	onNotify,
}: {
	product: ProductTransactionReportTarget;
	generatedBy: string;
	onNotify?: (message: string, variant?: "success" | "error") => void;
}) {
	const [view, setView] = useState<ProductDetailView>("transactions");
	const [fromMonth, setFromMonth] = useState("");
	const [toMonth, setToMonth] = useState("");
	const [page, setPage] = useState(0);
	const [exporting, setExporting] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [view, fromMonth, toMonth, product.id]);

	const {
		report,
		meta,
		loading,
		error: fetchError,
		fetchReport,
	} = useProductDetailReport({
		productId: product.id,
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
			: view === "customers"
				? (report?.customers ?? [])
				: (report?.cashiers ?? []);

	const handleExport = async () => {
		setExporting(true);
		setExportError(null);
		try {
			const data = await loadProductReportPdfData({
				productId: product.id,
				productName: product.name,
				view,
				from: monthStart(fromMonth),
				to: monthEnd(toMonth),
				rangeLabel: monthRangeLabel(fromMonth, toMonth),
				generatedBy,
			});
			await downloadProductReportPdf(data, data.fileName);
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
					note={`${summary?.member_transactions ?? 0} member · ${summary?.non_member_transactions ?? 0} non-member`}
				/>
				<StatCard
					loading={loading}
					label="Units Sold"
					value={summary?.units_sold ?? 0}
					note="Total item terjual"
				/>
				<StatCard
					loading={loading}
					label="Gross Sales"
					value={formatCurrency(summary?.gross_sales)}
					note="Sebelum diskon & pajak"
				/>
				<StatCard
					loading={loading}
					label="Period"
					value={monthRangeLabel(fromMonth, toMonth) ?? "All time"}
					note="Rentang tanggal filter"
				/>
			</StatGrid>

			<ProductReportTable
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
