import {
	DollarSignIcon,
	FileDownIcon,
	Loader2,
	PackageIcon,
	ShoppingCartIcon,
	WalletIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import BarChart from "../../components/charts/bar-chart";
import DonutChart from "../../components/charts/donut-chart";
import { categorical } from "../../components/charts/palette";
import DataTable, {
	createTableColumnHelper,
} from "../../components/tables/data-table";
import Badge from "../../components/ui/badge";
import Button from "../../components/ui/button";
import Card, { CardHeader } from "../../components/ui/card";
import EmptyState from "../../components/ui/empty-state";
import ErrorBanner from "../../components/ui/error-banner";
import FilterPills from "../../components/ui/filter-pills";
import Section from "../../components/ui/section";
import StatCard, { StatGrid } from "../../components/ui/stat-card";
import StatTile from "../../components/ui/stat-tile";
import Toast from "../../components/ui/toast";
import {
	formatCompactCurrency,
	formatCurrency,
	fillSalesPeriods,
	formatPeriodLabel,
	TIME_RANGE_ITEMS,
	toNumber,
	type TimeRange,
} from "../../features/reports/format";
import { useDashboardReports } from "../../features/reports/hooks/useDashboardReports";
import { loadSalesReportPdfData } from "../../features/reports/pdf/loadSalesReport";
import { downloadSalesReportPdf } from "../../features/reports/pdf/salesReportPdf";
import { useFlash } from "../../hooks/useFlash";
import { formatDate } from "../../libs/format";
import type { RootState } from "../../store";

interface TopProductRow {
	id: string;
	rank: number;
	name: string;
	code: string;
	qty: number;
	revenue: number;
}

interface CashierRow {
	id: string;
	name: string;
	username: string;
	role: string;
	txn: number;
	revenue: number;
	avg: number;
	collected: number;
	gap: number;
}

const RIGHT_CELL = "text-right font-medium text-text-h";
const RIGHT_STRONG = "text-right font-bold text-text-h";

const topProductHelper = createTableColumnHelper<TopProductRow>();

const TOP_PRODUCT_COLUMNS = topProductHelper.columns([
	topProductHelper.accessor("rank", {
		header: "#",
		cell: ({ row }) => (
			<span className="inline-flex size-6 items-center justify-center rounded-lg bg-primary-light text-2xs font-bold text-primary">
				{row.original.rank}
			</span>
		),
		meta: { headClassName: "w-10" },
	}),
	topProductHelper.accessor("name", {
		header: "Product",
		cell: ({ row }) => (
			<>
				<p className="font-semibold text-text-h">{row.original.name}</p>
				<p className="text-2xs text-text">{row.original.code}</p>
			</>
		),
	}),
	topProductHelper.accessor("qty", {
		header: "Sold",
		cell: ({ row }) => row.original.qty.toLocaleString("en-US"),
		meta: { headClassName: "text-right", cellClassName: RIGHT_CELL },
	}),
	topProductHelper.accessor("revenue", {
		header: "Revenue",
		cell: ({ row }) => formatCurrency(row.original.revenue),
		meta: { headClassName: "text-right", cellClassName: RIGHT_STRONG },
	}),
]);

const cashierHelper = createTableColumnHelper<CashierRow>();

const CASHIER_COLUMNS = cashierHelper.columns([
	cashierHelper.accessor("name", {
		header: "Cashier",
		cell: ({ row }) => (
			<>
				<p className="font-semibold text-text-h">{row.original.name}</p>
				<p className="text-2xs text-text capitalize">
					@{row.original.username} · {row.original.role}
				</p>
			</>
		),
	}),
	cashierHelper.accessor("txn", {
		header: "Transactions",
		cell: ({ row }) => row.original.txn.toLocaleString("en-US"),
		meta: { headClassName: "text-right", cellClassName: RIGHT_CELL },
	}),
	cashierHelper.accessor("revenue", {
		header: "Total Sales",
		cell: ({ row }) => formatCurrency(row.original.revenue),
		meta: { headClassName: "text-right", cellClassName: RIGHT_STRONG },
	}),
	cashierHelper.accessor("avg", {
		header: "Avg Order",
		cell: ({ row }) => formatCurrency(row.original.avg),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-text-h",
		},
	}),
	cashierHelper.accessor("collected", {
		header: "Collected",
		cell: ({ row }) => formatCurrency(row.original.collected),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-text-h",
		},
	}),
	cashierHelper.accessor("gap", {
		header: "Gap",
		cell: ({ row }) => (
			<span
				className={
					row.original.gap === 0
						? "font-medium text-deep-valid"
						: "font-medium text-deep-warn"
				}
			>
				{formatCurrency(row.original.gap)}
			</span>
		),
		meta: { headClassName: "text-right", cellClassName: "text-right" },
	}),
]);

export default function MainDashboard() {
	const [timeRange, setTimeRange] = useState<TimeRange>("3M");
	const [exporting, setExporting] = useState(false);
	const user = useSelector((state: RootState) => state.auth.user);
	const { flash, show, clear } = useFlash();
	const {
		sales,
		products,
		paymentMethods,
		cashiers,
		customers,
		loading,
		error,
		reload,
		range,
	} = useDashboardReports(timeRange);

	const salesSummary = sales?.summary;
	const productSummary = products?.summary;
	const reconciliation = paymentMethods?.summary ?? cashiers?.summary;

	const chartData = useMemo(() => {
		if (!sales) return [];
		return fillSalesPeriods(sales.rows, sales.period, range.from, range.to).map(
			(point) => ({
				label: formatPeriodLabel(point.periodStart, sales.period),
				value: point.value,
			}),
		);
	}, [sales, range.from, range.to]);

	const topProducts = useMemo<TopProductRow[]>(() => {
		return (products?.items ?? []).slice(0, 5).map((item, index) => ({
			id: item.product_item_id,
			rank: index + 1,
			name: item.product_name,
			code: item.variant_name
				? `${item.product_code} · ${item.variant_name}`
				: item.product_code,
			qty: toNumber(item.units_sold),
			revenue: toNumber(item.gross_sales),
		}));
	}, [products]);

	const methodRows = useMemo(() => {
		const methods = paymentMethods?.methods ?? [];
		const total = methods.reduce(
			(sum, method) => sum + toNumber(method.total_sales),
			0,
		);
		return methods
			.filter((method) => toNumber(method.total_sales) > 0)
			.map((method, index) => ({
				id: method.payment_method_id,
				name: method.name,
				count: method.transaction_count,
				value: toNumber(method.total_sales),
				pct:
					total > 0
						? Math.round((toNumber(method.total_sales) / total) * 100)
						: 0,
				color: categorical[index % categorical.length],
			}));
	}, [paymentMethods]);

	const donutSlices = methodRows.map((row) => ({
		label: row.name,
		value: row.value,
	}));

	const cashierRows = useMemo<CashierRow[]>(
		() =>
			(cashiers?.cashiers ?? []).slice(0, 5).map((cashier) => ({
				id: cashier.cashier_id,
				name: cashier.fullname,
				username: cashier.username,
				role: cashier.role,
				txn: toNumber(cashier.transaction_count),
				revenue: toNumber(cashier.total_sales),
				avg: toNumber(cashier.average_transaction),
				collected: toNumber(cashier.collected_amount),
				gap: toNumber(cashier.payment_gap),
			})),
		[cashiers],
	);

	const handleExport = async () => {
		setExporting(true);
		try {
			const data = await loadSalesReportPdfData({
				range: timeRange,
				from: range.from,
				to: range.to,
				period: range.period,
				generatedBy: user?.fullname ?? "Admin",
			});
			await downloadSalesReportPdf(data, data.fileName);
			show("PDF berhasil dibuat.", "success");
		} catch (exportError) {
			show(
				exportError instanceof Error
					? exportError.message
					: "Gagal membuat PDF",
				"error",
			);
		} finally {
			setExporting(false);
		}
	};

	const statCards = [
		{
			id: "revenue",
			label: "Total Revenue",
			value: formatCurrency(salesSummary?.total_sales),
			note: `${salesSummary?.transaction_count ?? 0} completed transactions`,
			icon: DollarSignIcon,
			iconClassName: "bg-primary-light text-primary",
		},
		{
			id: "transactions",
			label: "Transactions",
			value: salesSummary?.transaction_count ?? 0,
			note: `${customers?.summary.active_members ?? 0} active members`,
			icon: ShoppingCartIcon,
			iconClassName: "bg-valid text-deep-valid",
		},
		{
			id: "average",
			label: "Avg Order Value",
			value: formatCurrency(salesSummary?.average_transaction),
			note: "Per completed transaction",
			icon: WalletIcon,
			iconClassName: "bg-warn text-deep-warn",
		},
		{
			id: "units",
			label: "Units Sold",
			value: productSummary?.units_sold ?? 0,
			note: `${productSummary?.variants ?? 0} product variants`,
			icon: PackageIcon,
			iconClassName: "bg-info text-deep-info",
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<Toast
				message={flash?.message}
				variant={flash?.variant}
				onDismiss={clear}
			/>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-text-h">Dashboard Overview</h1>
					<p className="text-xs text-text">
						Sales performance, inventory movement, and payment distribution for
						the selected period.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<FilterPills
						label="Time period range filter"
						items={TIME_RANGE_ITEMS}
						value={timeRange}
						onValueChange={setTimeRange}
					/>
					<Button
						variant="outline"
						size="sm"
						disabled={exporting}
						onClick={handleExport}
					>
						{exporting ? (
							<Loader2
								size={14}
								className="animate-spin"
							/>
						) : (
							<FileDownIcon size={14} />
						)}
						{exporting ? "Menyiapkan..." : "Export Report"}
					</Button>
				</div>
			</div>

			{error && (
				<ErrorBanner
					message={error}
					onRetry={reload}
				/>
			)}

			<Section title="Overview">
				<StatGrid>
					{statCards.map((card) => {
						// const Icon = card.icon;
						return (
							<StatCard
								key={card.id}
								accent
								loading={loading}
								label={card.label}
								value={card.value}
								note={card.note}
								// icon={<Icon size={16} />}
								iconClassName={card.iconClassName}
							/>
						);
					})}
				</StatGrid>
			</Section>

			<Section title="Sales Performance">
				<Card
					padding="lg"
					className="flex flex-col gap-4"
				>
					<CardHeader
						title="Sales Trend"
						description={`${range.period === "day" ? "Daily" : "Monthly"} revenue · ${formatDate(range.from)} – ${formatDate(range.to)}`}
					>
						<div className="flex items-center gap-2">
							<span className="rounded-lg bg-base px-2.5 py-1 text-2xs font-semibold text-text-h">
								Total: {formatCurrency(salesSummary?.total_sales)}
							</span>
							<span className="rounded-lg bg-base px-2.5 py-1 text-2xs font-semibold text-text-h">
								Avg: {formatCurrency(salesSummary?.average_transaction)}
							</span>
						</div>
					</CardHeader>

					<div className="mt-2">
						{loading ? (
							<div className="h-70 animate-pulse rounded-lg bg-base" />
						) : chartData.length > 0 ? (
							<BarChart
								data={chartData}
								ariaLabel="Sales revenue trend"
								height={280}
								format={formatCompactCurrency}
							/>
						) : (
							<EmptyState>No sales recorded for this period.</EmptyState>
						)}
					</div>
				</Card>
			</Section>

			<Section title="Reporting">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
					<DataTable
						label="Top selling products"
						columns={TOP_PRODUCT_COLUMNS}
						rows={topProducts}
						rowId={(row) => row.id}
						loading={loading}
						loadingLabel="Memuat produk..."
						emptyLabel="No product sales for this period."
						tableClassName="text-xs"
						cardClassName="lg:col-span-3"
						header={
							<CardHeader
								title="Top Selling Products"
								description="Best performers this period"
							>
								<Badge
									variant="primary"
									size="sm"
								>
									{topProducts.length} items
								</Badge>
							</CardHeader>
						}
					/>

					<Card
						padding="md"
						className="flex flex-col gap-4 lg:col-span-2"
					>
						<CardHeader
							title="Payment Methods"
							description="Collected amount distribution"
						/>

						{loading ? (
							<div className="h-45 animate-pulse rounded-lg bg-base" />
						) : donutSlices.length > 0 ? (
							<div className="flex flex-col gap-4">
								<DonutChart
									data={donutSlices}
									ariaLabel="Payment method distribution"
									height={180}
									format={formatCompactCurrency}
								/>

								<div className="border-t border-base-border pt-3">
									<h4 className="mb-3 text-xs font-semibold text-text-h">
										Breakdown
									</h4>
									<div className="flex flex-col gap-3">
										{methodRows.map((row) => (
											<div
												key={row.id}
												className="flex flex-col gap-1"
											>
												<div className="flex items-center justify-between text-xs">
													<div className="flex items-center gap-2">
														<span
															className="size-2.5 rounded-full"
															style={{ backgroundColor: row.color }}
														/>
														<span className="font-medium text-text-h">
															{row.name}
														</span>
													</div>
													<div className="flex items-center gap-2">
														<span className="text-2xs font-normal text-text">
															{row.count} txn
														</span>
														<span
															className="text-xs font-bold"
															style={{ color: row.color }}
														>
															{row.pct}%
														</span>
													</div>
												</div>
												<div className="h-1.5 w-full overflow-hidden rounded-full bg-base">
													<div
														className="h-full rounded-full transition-all duration-300"
														style={{
															width: `${row.pct}%`,
															backgroundColor: row.color,
														}}
													/>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						) : (
							<EmptyState>No payments collected for this period.</EmptyState>
						)}
					</Card>
				</div>
			</Section>

			<Section title="Reconciliation">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					<StatTile
						label="Gross Sales"
						value={loading ? "—" : formatCurrency(reconciliation?.gross_sales)}
					/>
					<StatTile
						label="Discount"
						value={
							loading ? "—" : formatCurrency(reconciliation?.discount_amount)
						}
					/>
					<StatTile
						label="Tax"
						value={loading ? "—" : formatCurrency(reconciliation?.tax_amount)}
					/>
					<StatTile
						label="Collected"
						value={
							loading ? "—" : formatCurrency(reconciliation?.collected_amount)
						}
					/>
					<StatTile
						label="Payment Gap"
						value={loading ? "—" : formatCurrency(reconciliation?.payment_gap)}
					/>
				</div>
			</Section>

			<Section title="Cashier Performance">
				<DataTable
					label="Cashier performance"
					columns={CASHIER_COLUMNS}
					rows={cashierRows}
					rowId={(row) => row.id}
					loading={loading}
					loadingLabel="Memuat kasir..."
					emptyLabel="No cashier activity for this period."
					tableClassName="text-xs"
				/>
			</Section>
		</div>
	);
}
