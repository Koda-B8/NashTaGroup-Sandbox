import {
	TrendingUpIcon,
	TrendingDownIcon,
	DollarSignIcon,
	ShoppingCartIcon,
	WalletIcon,
} from "lucide-react";
import { useState } from "react";

import BarChart from "../../components/charts/bar-chart";
import DonutChart from "../../components/charts/donut-chart";
import DataTable, {
	createTableColumnHelper,
} from "../../components/tables/data-table";
import Badge from "../../components/ui/badge";
import Button from "../../components/ui/button";
import Card, { CardHeader } from "../../components/ui/card";
import FilterPills from "../../components/ui/filter-pills";
import Section from "../../components/ui/section";
import StatCard from "../../components/ui/stat-card";

const SUMMARY_CARDS = [
	{
		id: "revenue",
		title: "Total Revenue",
		value: "Rp 128,450,000",
		period: "vs last month",
		trend: { value: "+12.5%", good: true },
		icon: DollarSignIcon,
		iconBg: "bg-primary-light text-primary",
	},
	{
		id: "transactions",
		title: "Total Transactions",
		value: "2,847",
		period: "vs last month",
		trend: { value: "+8.2%", good: true },
		icon: ShoppingCartIcon,
		iconBg: "bg-valid text-deep-valid",
	},
	{
		id: "avg-order",
		title: "Avg Order Value",
		value: "Rp 45,120",
		period: "vs last month",
		trend: { value: "+3.1%", good: true },
		icon: WalletIcon,
		iconBg: "bg-warn text-deep-warn",
	},
];

const SALES_MONTHLY_DATA = [
	{ label: "Jan", value: 68 },
	{ label: "Feb", value: 95 },
	{ label: "Mar", value: 60 },
	{ label: "Apr", value: 118 },
	{ label: "May", value: 82 },
	{ label: "Jun", value: 155 },
	{ label: "Jul", value: 105 },
	{ label: "Aug", value: 135 },
	{ label: "Sep", value: 88 },
	{ label: "Oct", value: 148 },
	{ label: "Nov", value: 112 },
	{ label: "Dec", value: 168 },
];

const TOP_PRODUCTS = [
	{
		rank: 1,
		name: "Nasi Goreng Spesial",
		category: "Rice Dish",
		qty: "342",
		revenue: "Rp 17.1M",
		isUp: true,
		change: "+14.2%",
		badgeColor: "bg-primary-light text-primary",
	},
	{
		rank: 2,
		name: "Ayam Bakar",
		category: "Grill",
		qty: "298",
		revenue: "Rp 14.9M",
		isUp: true,
		change: "+8.5%",
		badgeColor: "bg-valid text-deep-valid",
	},
	{
		rank: 3,
		name: "Es Teh Manis",
		category: "Beverage",
		qty: "521",
		revenue: "Rp 5.2M",
		isUp: false,
		change: "-2.1%",
		badgeColor: "bg-warn text-deep-warn",
	},
	{
		rank: 4,
		name: "Mie Goreng",
		category: "Noodle",
		qty: "276",
		revenue: "Rp 9.7M",
		isUp: true,
		change: "+5.4%",
		badgeColor: "bg-purple-100 text-purple-700",
	},
	{
		rank: 5,
		name: "Soto Ayam",
		category: "Soup",
		qty: "198",
		revenue: "Rp 7.9M",
		isUp: false,
		change: "-1.8%",
		badgeColor: "bg-danger text-deep-danger",
	},
];

const topProduct = createTableColumnHelper<(typeof TOP_PRODUCTS)[number]>();

const TOP_PRODUCT_COLUMNS = topProduct.columns([
	topProduct.accessor("rank", {
		header: "#",
		cell: ({ row }) => (
			<span
				className={`inline-flex size-6 items-center justify-center rounded-lg text-2xs font-bold ${row.original.badgeColor}`}
			>
				{row.original.rank}
			</span>
		),
		meta: { headClassName: "w-10" },
	}),
	topProduct.accessor("name", {
		header: "Product",
		cell: ({ row }) => (
			<>
				<p className="font-semibold text-text-h">{row.original.name}</p>
				<p className="text-2xs text-text">{row.original.category}</p>
			</>
		),
	}),
	topProduct.accessor("qty", {
		header: "Sold",
		cell: ({ row }) => row.original.qty,
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right font-medium text-text-h",
		},
	}),
	topProduct.accessor("revenue", {
		header: "Revenue",
		cell: ({ row }) => row.original.revenue,
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right font-bold text-text-h",
		},
	}),
	topProduct.accessor("change", {
		header: "Trend",
		cell: ({ row }) => (
			<span
				className={`inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-3xs font-semibold ${
					row.original.isUp
						? "bg-valid text-deep-valid"
						: "bg-danger text-deep-danger"
				}`}
			>
				{row.original.isUp ? (
					<TrendingUpIcon size={10} />
				) : (
					<TrendingDownIcon size={10} />
				)}
				{row.original.change}
			</span>
		),
		meta: { headClassName: "text-center", cellClassName: "text-center" },
	}),
]);

const PAYMENT_METHODS = [
	{ name: "Cash", pct: 45, count: "1,281", color: "#3b82f6" },
	{ name: "Transfer", pct: 30, count: "854", color: "#10b981" },
	{ name: "QRIS", pct: 15, count: "427", color: "#f59e0b" },
	{ name: "Debit Card", pct: 10, count: "285", color: "#ef4444" },
];

const DONUT_CHART_DATA = PAYMENT_METHODS.map((item) => ({
	label: item.name,
	value: item.pct,
}));

type TimeRange = "1M" | "3M" | "6M" | "1Y";

export default function MainDashboard() {
	const [timeRange, setTimeRange] = useState<TimeRange>("1Y");

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-text-h">Dashboard Overview</h1>
					<p className="text-xs text-text">
						Monitor sales performance, inventory, and payment distribution.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<FilterPills
						label="Time period range filter"
						items={[
							{ label: "1M", value: "1M" },
							{ label: "3M", value: "3M" },
							{ label: "6M", value: "6M" },
							{ label: "1Y", value: "1Y" },
						]}
						value={timeRange}
						onValueChange={(val) => setTimeRange(val as TimeRange)}
					/>
					<Button
						variant="outline"
						size="sm"
					>
						Export Report
					</Button>
				</div>
			</div>

			<Section title="Overview">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{SUMMARY_CARDS.map((card) => {
						const Icon = card.icon;
						return (
							<StatCard
								key={card.id}
								accent
								label={card.title}
								value={card.value}
								note={card.period}
								trend={card.trend}
								icon={<Icon size={16} />}
								iconClassName={card.iconBg}
							/>
						);
					})}
				</div>
			</Section>

			<Section title="Sales Performance">
				<Card
					padding="lg"
					className="flex flex-col gap-4"
				>
					<CardHeader
						title="Sales Trend"
						description="Monthly revenue · 2025"
					>
						<div className="flex items-center gap-4 text-xs">
							<div className="flex items-center gap-1.5">
								<span className="size-2.5 rounded-full bg-primary" />
								<span className="font-medium text-text-h">Revenue</span>
							</div>
							<span className="rounded-lg bg-base px-2.5 py-1 text-2xs font-semibold text-text-h">
								Total: Rp 128.45M
							</span>
						</div>
					</CardHeader>

					<div className="mt-2">
						<BarChart
							data={SALES_MONTHLY_DATA}
							ariaLabel="Monthly sales revenue chart for 2025"
							height={280}
							format={(val) => `Rp ${val}M`}
						/>
					</div>
				</Card>
			</Section>

			<Section title="Reporting">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
					<DataTable
						label="Top selling products"
						columns={TOP_PRODUCT_COLUMNS}
						rows={TOP_PRODUCTS}
						rowId={(p) => String(p.rank)}
						loading={false}
						loadingLabel=""
						emptyLabel="No products yet."
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
									5 items
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
							description="Transaction distribution"
						/>

						<div className="flex flex-col gap-4">
							<div className="relative">
								<DonutChart
									data={DONUT_CHART_DATA}
									ariaLabel="Payment methods transaction breakdown"
									height={180}
									format={(val) => `${val}%`}
								/>
							</div>

							<div className="border-t border-base-border pt-3">
								<h4 className="mb-3 text-xs font-semibold text-text-h">
									Breakdown
								</h4>
								<div className="flex flex-col gap-3">
									{PAYMENT_METHODS.map((pm) => (
										<div
											key={pm.name}
											className="flex flex-col gap-1"
										>
											<div className="flex items-center justify-between text-xs">
												<div className="flex items-center gap-2">
													<span
														className="size-2.5 rounded-full"
														style={{ backgroundColor: pm.color }}
													/>
													<span className="font-medium text-text-h">
														{pm.name}
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-2xs font-normal text-text">
														{pm.count} txn
													</span>
													<span
														className="text-xs font-bold"
														style={{ color: pm.color }}
													>
														{pm.pct}%
													</span>
												</div>
											</div>
											<div className="h-1.5 w-full overflow-hidden rounded-full bg-base">
												<div
													className="h-full rounded-full transition-all duration-300"
													style={{
														width: `${pm.pct}%`,
														backgroundColor: pm.color,
													}}
												/>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</Card>
				</div>
			</Section>
		</div>
	);
}
