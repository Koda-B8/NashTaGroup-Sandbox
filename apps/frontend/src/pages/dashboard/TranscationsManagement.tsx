import { useCallback, useEffect, useMemo, useState } from "react";

import { DetailLayout } from "../../components/ui/detail-panel";
import ErrorBanner from "../../components/ui/error-banner";
import Section from "../../components/ui/section";
import Toast from "../../components/ui/toast";
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
import { useFlash } from "../../hooks/useFlash";
import { useRowSelection, useSelectedItem } from "../../hooks/useRowSelection";

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
	const pageSize = 10;

	const { flash, show, clear } = useFlash();

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

	const {
		selectedId,
		setSelectedId,
		selectedIds,
		allPageSelected,
		somePageSelected,
		toggleAllPage,
		toggleOne,
	} = useRowSelection(paged, transactions.length);

	const selected = useSelectedItem(
		transactions,
		selectedId,
		paged[0] ?? transactions[0],
	);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter, memberFilter, filters]);

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
	const handleCopyNumber = useCallback(
		async (value: string) => {
			try {
				await navigator.clipboard.writeText(value);
				show(`Nomor transaksi ${value} disalin`);
			} catch {
				show("Gagal menyalin nomor transaksi", "error");
			}
		},
		[show],
	);

	const totalLabel = `Showing ${paged.length} of ${
		isServerPaginated ? server.totalItems : sorted.length
	} transactions`;

	return (
		<div className="flex flex-col gap-6">
			<Toast
				message={flash?.message}
				variant={flash?.variant}
				onDismiss={clear}
			/>
			{fetchError && (
				<ErrorBanner
					message={fetchError}
					onRetry={fetchTransactions}
				/>
			)}

			<TransactionOverview
				stats={stats}
				loading={loading}
			/>

			<Section
				title="Transactions"
				className="@container"
			>
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

				<DetailLayout wide>
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
						onPageChange={setPage}
						totalLabel={totalLabel}
					/>
					<TransactionDetailPanel
						transaction={selected}
						onCopyNumber={handleCopyNumber}
					/>
				</DetailLayout>
			</Section>
		</div>
	);
}
