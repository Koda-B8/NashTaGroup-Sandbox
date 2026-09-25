import { RotateCcwIcon, RefreshCwIcon } from "lucide-react";
import type { ReactNode } from "react";

import Button from "../../../components/ui/button";
import Combobox from "../../../components/ui/combobox";
import DatePicker, {
	formatMonthValue,
} from "../../../components/ui/date-picker";
import FilterPills from "../../../components/ui/filter-pills";
import Input from "../../../components/ui/input";
import Select from "../../../components/ui/select";
import {
	MEMBER_OPTIONS,
	SORT_OPTIONS,
	STATUS_OPTIONS,
	type MemberFilter,
	type SortBy,
	type StatusFilter,
} from "../format";
import type { FilterOption } from "../hooks/useTransactionFilterOptions";

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-2xs font-semibold tracking-wider text-text uppercase">
				{label}
			</span>
			{children}
		</div>
	);
}

export interface TransactionFiltersBarProps {
	search: string;
	onSearchChange: (value: string) => void;
	statusFilter: StatusFilter;
	onStatusChange: (value: string) => void;
	memberFilter: MemberFilter;
	onMemberChange: (value: string) => void;
	month: string;
	onMonthChange: (value: string) => void;
	cashierId: string;
	onCashierChange: (value: string) => void;
	paymentMethodId: string;
	onPaymentMethodChange: (value: string) => void;
	customerId: string;
	onCustomerChange: (value: string) => void;
	cashierOptions: FilterOption[];
	paymentMethodOptions: FilterOption[];
	customerOptions: FilterOption[];
	optionsLoading: boolean;
	sortBy: SortBy;
	onSortChange: (value: string) => void;
	activeFilterCount: number;
	onReset: () => void;
	onRefresh: () => void;
	refreshing: boolean;
}

export default function TransactionFiltersBar({
	search,
	onSearchChange,
	statusFilter,
	onStatusChange,
	memberFilter,
	onMemberChange,
	month,
	onMonthChange,
	cashierId,
	onCashierChange,
	paymentMethodId,
	onPaymentMethodChange,
	customerId,
	onCustomerChange,
	cashierOptions,
	paymentMethodOptions,
	customerOptions,
	optionsLoading,
	sortBy,
	onSortChange,
	activeFilterCount,
	onReset,
	onRefresh,
	refreshing,
}: TransactionFiltersBarProps) {
	const allCashiers = { label: "All cashiers", value: "" };
	const allPaymentMethods = { label: "All methods", value: "" };
	const allCustomers = { label: "All customers", value: "" };

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
				<Input
					size="sm"
					placeholder="Search transaction number..."
					value={search}
					onChange={(event) => onSearchChange(event.currentTarget.value)}
					className="w-full shrink-0 sm:max-w-[248px]"
					aria-label="Search transaction number"
				/>
				<FilterPills
					variant="segmented"
					label="Filter transactions by status"
					items={STATUS_OPTIONS}
					value={statusFilter}
					onValueChange={onStatusChange}
					className="shrink-0"
				/>
				<FilterPills
					label="Filter transactions by member type"
					items={MEMBER_OPTIONS}
					value={memberFilter}
					onValueChange={onMemberChange}
					className="shrink-0"
				/>
				<div className="flex shrink-0 items-center gap-2 sm:ml-auto">
					<Select
						label="Sort this page of transactions"
						value={sortBy}
						onValueChange={onSortChange}
						items={SORT_OPTIONS}
						className="h-8 w-40 min-w-0 text-xs"
						placeholder="Sort page"
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={onRefresh}
						disabled={refreshing}
					>
						<RefreshCwIcon
							size={14}
							className={refreshing ? "animate-spin" : ""}
						/>
						Refresh
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
				<Field label="Month">
					<DatePicker
						label="Filter by month"
						value={month}
						onValueChange={onMonthChange}
						size="sm"
						className="w-full min-w-0"
						placeholder="All months"
					/>
				</Field>
				<Field label="Cashier">
					<Combobox
						label="Filter by cashier"
						placeholder="All cashiers"
						items={[allCashiers, ...cashierOptions]}
						value={cashierId}
						onValueChange={onCashierChange}
						size="sm"
						className="w-full min-w-0"
						emptyMessage="Cashier tidak ditemukan."
					/>
				</Field>
				<Field label="Payment Method">
					<Combobox
						label="Filter by payment method"
						placeholder="All methods"
						items={[allPaymentMethods, ...paymentMethodOptions]}
						value={paymentMethodId}
						onValueChange={onPaymentMethodChange}
						size="sm"
						className="w-full min-w-0"
						emptyMessage="Payment method tidak ditemukan."
					/>
				</Field>
				<Field label="Customer">
					<Combobox
						label="Filter by customer"
						placeholder="All customers"
						items={[allCustomers, ...customerOptions]}
						value={customerId}
						onValueChange={onCustomerChange}
						size="sm"
						className="w-full min-w-0"
						emptyMessage="Customer tidak ditemukan."
					/>
				</Field>
				<div className="flex items-end">
					<Button
						variant="ghost"
						size="sm"
						onClick={onReset}
						disabled={activeFilterCount === 0}
						block
					>
						<RotateCcwIcon size={14} />
						Reset{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
					</Button>
				</div>
			</div>

			{optionsLoading && (
				<p className="text-2xs text-text">Memuat opsi filter...</p>
			)}

			{(month || cashierId || paymentMethodId || customerId) && (
				<div className="flex flex-wrap items-center gap-1.5 text-2xs text-text">
					<span className="font-semibold tracking-wider uppercase">Active</span>
					{month && (
						<span className="rounded-full border border-base-border bg-base px-2 py-0.5">
							Month: {formatMonthValue(month)}
						</span>
					)}
					{cashierId && (
						<span className="rounded-full border border-base-border bg-base px-2 py-0.5">
							Cashier:{" "}
							{cashierOptions.find((option) => option.value === cashierId)
								?.label ?? cashierId.slice(0, 8)}
						</span>
					)}
					{paymentMethodId && (
						<span className="rounded-full border border-base-border bg-base px-2 py-0.5">
							Payment:{" "}
							{paymentMethodOptions.find(
								(option) => option.value === paymentMethodId,
							)?.label ?? paymentMethodId.slice(0, 8)}
						</span>
					)}
					{customerId && (
						<span className="rounded-full border border-base-border bg-base px-2 py-0.5">
							Customer:{" "}
							{customerOptions.find((option) => option.value === customerId)
								?.label ?? customerId.slice(0, 8)}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
