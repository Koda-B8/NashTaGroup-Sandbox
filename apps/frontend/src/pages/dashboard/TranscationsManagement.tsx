import { useCallback, useEffect, useMemo, useState } from "react";

import TransactionDetailPanel from "../../features/transactions/components/TransactionDetailPanel";
import TransactionFiltersBar from "../../features/transactions/components/TransactionFiltersBar";
import TransactionOverview from "../../features/transactions/components/TransactionOverview";
import TransactionTable from "../../features/transactions/components/TransactionTable";
import {
	type MemberFilter,
	type SortBy,
	type StatusFilter,
} from "../../features/transactions/format";
import { useTransactionFilterOptions } from "../../features/transactions/hooks/useTransactionFilterOptions";
import {
	type TransactionFilters,
	useTransactionsList,
} from "../../features/transactions/hooks/useTransactionsList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const EMPTY_FILTERS: TransactionFilters = {
	month: "",
	cashierId: "",
	paymentMethodId: "",
	customerId: "",
};

export default function OrdersManagementDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [memberFilter, setMemberFilter] = useState<MemberFilter>("All");
	const [sortBy, setSortBy] = useState<SortBy>("newest");
	const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
	const [page, setPage] = useState(0);
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [toast, setToast] = useState<string | undefined>(undefined);
	const [toastVariant, setToastVariant] = useState<"success" | "error">(
		"success",
	);
	const pageSize = 8;

	const {
		transactions,
		loading,
		error: fetchError,
		fetchTransactions,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
	} = useTransactionsList({
		debouncedSearch,
		statusFilter,
		memberFilter,
		sortBy,
		filters,
		page,
		pageSize,
	});

	const {
		cashierOptions,
		paymentMethodOptions,
		customerOptions,
		loading: optionsLoading,
	} = useTransactionFilterOptions(transactions);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter, memberFilter, filters]);

	useEffect(() => {
		queueMicrotask(() => {
			if (paged.length > 0)
				setSelectedId((prev) =>
					prev && paged.some((transaction) => transaction.id === prev)
						? prev
						: paged[0]!.id,
				);
			else if (transactions.length === 0) setSelectedId(undefined);
		});
	}, [paged, transactions.length]);

	const flash = useCallback(
		(message: string, variant: "success" | "error" = "success") => {
			setToast(message);
			setToastVariant(variant);
			setTimeout(() => setToast(undefined), 2800);
		},
		[],
	);

	const selected = useMemo(() => {
		if (!selectedId) return paged[0] ?? transactions[0] ?? undefined;
		return (
			transactions.find((transaction) => transaction.id === selectedId) ??
			paged[0] ??
			transactions[0] ??
			undefined
		);
	}, [selectedId, paged, transactions]);

	const allPageSelected =
		paged.length > 0 &&
		paged.every((transaction) => selectedIds.has(transaction.id));
	const somePageSelected =
		paged.some((transaction) => selectedIds.has(transaction.id)) &&
		!allPageSelected;

	const toggleAllPage = useCallback(
		(checked: boolean) =>
			setSelectedIds((prev) => {
				const next = new Set(prev);
				if (checked) paged.forEach((transaction) => next.add(transaction.id));
				else paged.forEach((transaction) => next.delete(transaction.id));
				return next;
			}),
		[paged],
	);

	const toggleOne = useCallback(
		(id: string, checked: boolean) =>
			setSelectedIds((prev) => {
				const next = new Set(prev);
				if (checked) next.add(id);
				else next.delete(id);
				return next;
			}),
		[],
	);

	const handleStatusChange = useCallback(
		(value: string) => setStatusFilter(value as StatusFilter),
		[],
	);
	const handleMemberChange = useCallback(
		(value: string) => setMemberFilter(value as MemberFilter),
		[],
	);
	const handleSortChange = useCallback(
		(value: string) => setSortBy(value as SortBy),
		[],
	);
	const setFilter = useCallback(
		(key: keyof TransactionFilters, value: string) =>
			setFilters((prev) => ({ ...prev, [key]: value })),
		[],
	);
	const handleMonthChange = useCallback(
		(value: string) => setFilter("month", value),
		[setFilter],
	);
	const handleCashierChange = useCallback(
		(value: string) => setFilter("cashierId", value),
		[setFilter],
	);
	const handlePaymentMethodChange = useCallback(
		(value: string) => setFilter("paymentMethodId", value),
		[setFilter],
	);
	const handleCustomerChange = useCallback(
		(value: string) => setFilter("customerId", value),
		[setFilter],
	);
	const activeFilterCount = useMemo(
		() =>
			[
				filters.month,
				filters.cashierId,
				filters.paymentMethodId,
				filters.customerId,
			].filter(Boolean).length,
		[filters],
	);
	const handleReset = useCallback(() => {
		setSearch("");
		setStatusFilter("All");
		setMemberFilter("All");
		setFilters(EMPTY_FILTERS);
	}, []);
	const handlePageChange = useCallback((next: number) => setPage(next), []);
	const handleCopyNumber = useCallback(
		async (value: string) => {
			try {
				await navigator.clipboard.writeText(value);
				flash(`Nomor transaksi ${value} disalin`);
			} catch {
				flash("Gagal menyalin nomor transaksi", "error");
			}
		},
		[flash],
	);

	const totalLabel = `Showing ${paged.length} of ${
		isServerPaginated ? server.totalItems : sorted.length
	} transactions`;

	return (
		<div className="flex flex-col gap-6">
			{toast && (
				<div
					className={`rounded-lg border px-4 py-2 text-sm ${
						toastVariant === "success"
							? "border-valid bg-valid text-deep-valid"
							: "border-danger bg-danger text-deep-danger"
					}`}
					role={toastVariant === "error" ? "alert" : "status"}
				>
					{toast}
				</div>
			)}
			{fetchError && (
				<div
					className="rounded-lg border border-danger bg-danger px-4 py-3 text-sm text-deep-danger"
					role="alert"
				>
					{fetchError}{" "}
					<button
						type="button"
						onClick={fetchTransactions}
						className="ml-2 font-semibold underline"
					>
						Coba lagi
					</button>
				</div>
			)}

			<TransactionOverview
				stats={stats}
				loading={loading}
			/>

			<section
				aria-labelledby="transactions-heading"
				className="@container flex flex-col gap-3"
			>
				<h2
					id="transactions-heading"
					className="text-[11px] font-semibold tracking-wider text-text uppercase"
				>
					Transactions
				</h2>

				<TransactionFiltersBar
					search={search}
					onSearchChange={setSearch}
					statusFilter={statusFilter}
					onStatusChange={handleStatusChange}
					memberFilter={memberFilter}
					onMemberChange={handleMemberChange}
					month={filters.month}
					onMonthChange={handleMonthChange}
					cashierId={filters.cashierId}
					onCashierChange={handleCashierChange}
					paymentMethodId={filters.paymentMethodId}
					onPaymentMethodChange={handlePaymentMethodChange}
					customerId={filters.customerId}
					onCustomerChange={handleCustomerChange}
					cashierOptions={cashierOptions}
					paymentMethodOptions={paymentMethodOptions}
					customerOptions={customerOptions}
					optionsLoading={optionsLoading}
					sortBy={sortBy}
					onSortChange={handleSortChange}
					activeFilterCount={activeFilterCount}
					onReset={handleReset}
					onRefresh={fetchTransactions}
					refreshing={loading}
				/>

				<div className="grid grid-cols-1 gap-4 @6xl:grid-cols-[1fr_320px]">
					<TransactionTable
						loading={loading}
						paged={paged}
						selectedId={selected?.id}
						selectedIds={selectedIds}
						allPageSelected={allPageSelected}
						somePageSelected={somePageSelected}
						onSelect={setSelectedId}
						onOpenDetail={(transaction) => setSelectedId(transaction.id)}
						onCopyNumber={handleCopyNumber}
						onToggleAll={toggleAllPage}
						onToggleOne={toggleOne}
						pageCount={pageCount}
						safePage={safePage}
						onPageChange={handlePageChange}
						totalLabel={totalLabel}
					/>
					<TransactionDetailPanel
						transaction={selected}
						onCopyNumber={handleCopyNumber}
					/>
				</div>
			</section>
		</div>
	);
}
