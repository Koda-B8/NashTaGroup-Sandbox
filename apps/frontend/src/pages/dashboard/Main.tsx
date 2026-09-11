import {
	TrendingUpIcon,
	TrendingDownIcon,
	DollarSignIcon,
	ShoppingCartIcon,
	WalletIcon,
	ArrowUpRightIcon,
	ArrowDownRightIcon,
} from "lucide-react";
import { useState } from "react";

import BarChart from "../../components/charts/bar-chart";
import DonutChart from "../../components/charts/donut-chart";
import Badge from "../../components/ui/badge";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import FilterPills from "../../components/ui/filter-pills";

const SUMMARY_CARDS = [
	{
		id: "revenue",
		title: "Total Revenue",
		value: "Rp 128,450,000",
		change: "+12.5%",
		period: "vs last month",
		isUp: true,
		badgeVariant: "valid" as const,
		icon: DollarSignIcon,
		accentClass: "border-l-primary",
		iconBg: "bg-primary-light text-primary",
	},
	{
		id: "transactions",
		title: "Total Transactions",
		value: "2,847",
		change: "+8.2%",
		period: "vs last month",
		isUp: true,
		badgeVariant: "valid" as const,
		icon: ShoppingCartIcon,
		accentClass: "border-l-primary",
		iconBg: "bg-valid text-deep-valid",
	},
	{
		id: "avg-order",
		title: "Avg Order Value",
		value: "Rp 45,120",
		change: "+3.1%",
		period: "vs last month",
		isUp: true,
		badgeVariant: "valid" as const,
		icon: WalletIcon,
		accentClass: "border-l-primary",
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

			<section aria-labelledby="overview-heading">
				<h2
					id="overview-heading"
					className="mb-3 text-[11px] font-semibold tracking-wider text-text uppercase"
				>
					Overview
				</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{SUMMARY_CARDS.map((card) => {
						const Icon = card.icon;
						return (
							<Card
								key={card.id}
								padding="md"
								className={`border-l-4 ${card.accentClass} flex flex-col justify-between transition-shadow hover:shadow-sm`}
							>
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-text">
										{card.title}
									</span>
									<span
										className={`flex size-8 items-center justify-center rounded-lg ${card.iconBg}`}
									>
										<Icon size={16} />
									</span>
								</div>
								<div className="mt-3">
									<p className="text-2xl font-bold tracking-tight text-text-h">
										{card.value}
									</p>
									<div className="mt-2 flex items-center gap-2">
										<Badge
											variant={card.badgeVariant}
											size="sm"
										>
											{card.isUp ? (
												<ArrowUpRightIcon size={12} />
											) : (
												<ArrowDownRightIcon size={12} />
											)}
											{card.change}
										</Badge>
										<span className="text-[11px] text-text">{card.period}</span>
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			</section>

			<section aria-labelledby="sales-heading">
				<h2
					id="sales-heading"
					className="mb-3 text-[11px] font-semibold tracking-wider text-text uppercase"
				>
					Sales Performance
				</h2>
				<Card
					padding="lg"
					className="flex flex-col gap-4"
				>
					<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h5 className="font-bold">Sales Trend</h5>
							<p className="text-xs text-text">Monthly revenue · 2025</p>
						</div>
						<div className="flex items-center gap-4 text-xs">
							<div className="flex items-center gap-1.5">
								<span className="size-2.5 rounded-full bg-primary" />
								<span className="text-text-h font-medium">Revenue</span>
							</div>
							<span className="rounded-md bg-base px-2.5 py-1 text-[11px] font-semibold text-text-h">
								Total: Rp 128.45M
							</span>
						</div>
					</div>

					<div className="mt-2">
						<BarChart
							data={SALES_MONTHLY_DATA}
							ariaLabel="Monthly sales revenue chart for 2025"
							height={280}
							format={(val) => `Rp ${val}M`}
						/>
					</div>
				</Card>
			</section>

			<section aria-labelledby="reporting-heading">
				<h2
					id="reporting-heading"
					className="mb-3 text-[11px] font-semibold tracking-wider text-text uppercase"
				>
					Reporting
				</h2>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
					<Card
						padding="md"
						className="flex flex-col gap-4 lg:col-span-3"
					>
						<div className="flex items-center justify-between">
							<div>
								<h5 className="font-bold">Top Selling Products</h5>
								<p className="text-xs text-text">Best performers this period</p>
							</div>
							<Badge
								variant="primary"
								size="sm"
							>
								5 items
							</Badge>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b border-base-border bg-base text-[11px] font-semibold uppercase tracking-wider text-text">
										<th className="px-3 py-2.5 w-10">#</th>
										<th className="px-3 py-2.5">Product</th>
										<th className="px-3 py-2.5 text-right">Sold</th>
										<th className="px-3 py-2.5 text-right">Revenue</th>
										<th className="px-3 py-2.5 text-center">Trend</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-base-border">
									{TOP_PRODUCTS.map((p) => (
										<tr
											key={p.rank}
											className="transition-colors hover:bg-base/50"
										>
											<td className="px-3 py-3 font-medium">
												<span
													className={`inline-flex size-6 items-center justify-center rounded-md text-[11px] font-bold ${p.badgeColor}`}
												>
													{p.rank}
												</span>
											</td>
											<td className="px-3 py-3">
												<p className="font-semibold text-text-h">{p.name}</p>
												<p className="text-[11px] text-text">{p.category}</p>
											</td>
											<td className="px-3 py-3 text-right font-medium text-text-h">
												{p.qty}
											</td>
											<td className="px-3 py-3 text-right font-bold text-text-h">
												{p.revenue}
											</td>
											<td className="px-3 py-3 text-center">
												<span
													className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
														p.isUp
															? "bg-valid text-deep-valid"
															: "bg-danger text-deep-danger"
													}`}
												>
													{p.isUp ? (
														<TrendingUpIcon size={10} />
													) : (
														<TrendingDownIcon size={10} />
													)}
													{p.change}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</Card>

					<Card
						padding="md"
						className="flex flex-col gap-4 lg:col-span-2"
					>
						<div>
							<h5 className="font-bol">Payment Methods</h5>
							<p className="text-xs text-text">Transaction distribution</p>
						</div>

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
													<span className="text-text font-normal text-[11px]">
														{pm.count} txn
													</span>
													<span
														className="font-bold text-xs"
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
			</section>
		</div>
	);
}
