import { useCallback, useMemo } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import {
	listTransactions,
	type MemberType,
	type Transaction,
	type TransactionStatus,
} from "../api";
import { memberTypeOf, toNumber, type SortBy } from "../format";

export interface TransactionStats {
	total: number;
	completed: number;
	pending: number;
	cancelled: number;
	refunded: number;
	revenue: number;
	completionRate: number;
	memberCount: number;
}

export interface TransactionFilters {
	month: string;
	cashierId: string;
	paymentMethodId: string;
	customerId: string;
}

export function useTransactionsList(params: {
	debouncedSearch: string;
	statusFilter: "All" | TransactionStatus;
	memberFilter: "All" | MemberType;
	sortBy: SortBy;
	filters: TransactionFilters;
	page: number;
	pageSize: number;
}) {
	const {
		debouncedSearch,
		statusFilter,
		memberFilter,
		sortBy,
		filters,
		page,
		pageSize,
	} = params;
	const { month, cashierId, paymentMethodId, customerId } = filters;

	const clientFilter = useCallback(
		(items: Transaction[]) => {
			const query = debouncedSearch.trim().toLowerCase();
			return items.filter((transaction) => {
				if (query) {
					const haystack = `${transaction.transactionNumber} ${
						transaction.customer?.name ?? ""
					} ${transaction.customer?.phone ?? ""}`.toLowerCase();
					if (!haystack.includes(query)) return false;
				}
				if (statusFilter !== "All" && transaction.status !== statusFilter)
					return false;
				if (
					memberFilter !== "All" &&
					memberTypeOf(transaction) !== memberFilter
				)
					return false;
				if (month && !transaction.createdAt.startsWith(month)) return false;
				if (cashierId && transaction.cashier?.id !== cashierId) return false;
				if (customerId && transaction.customer?.id !== customerId) return false;
				return true;
			});
		},
		[debouncedSearch, statusFilter, memberFilter, month, cashierId, customerId],
	);

	const sortTransform = useCallback(
		(items: Transaction[]) =>
			[...items].sort((a, b) => {
				if (sortBy === "oldest") return a.createdAt.localeCompare(b.createdAt);
				if (sortBy === "amount_desc")
					return toNumber(b.totalAmount) - toNumber(a.totalAmount);
				if (sortBy === "amount_asc")
					return toNumber(a.totalAmount) - toNumber(b.totalAmount);
				return b.createdAt.localeCompare(a.createdAt);
			}),
		[sortBy],
	);

	const {
		items: transactions,
		meta,
		loading,
		error,
		fetchList: fetchTransactions,
		server,
		isServerPaginated,
		filtered: sorted,
		paged,
		pageCount,
		safePage,
	} = usePaginatedList<
		Transaction,
		{
			q?: string;
			status?: TransactionStatus;
			member_type?: MemberType;
			month?: string;
			cashier_id?: string;
			payment_method_id?: string;
			customer_id?: string;
		}
	>({
		fetcher: listTransactions,
		params: {
			q: debouncedSearch || undefined,
			status: statusFilter === "All" ? undefined : statusFilter,
			member_type: memberFilter === "All" ? undefined : memberFilter,
			month: month || undefined,
			cashier_id: cashierId || undefined,
			payment_method_id: paymentMethodId || undefined,
			customer_id: customerId || undefined,
		},
		page,
		pageSize,
		clientFilter,
		transform: sortTransform,
	});

	const stats = useMemo<TransactionStats>(() => {
		const total = meta?.pagination.total_items ?? transactions.length;
		const completed = transactions.filter(
			(transaction) => transaction.status === "completed",
		).length;
		const pending = transactions.filter(
			(transaction) => transaction.status === "pending",
		).length;
		const cancelled = transactions.filter(
			(transaction) => transaction.status === "cancelled",
		).length;
		const refunded = transactions.filter(
			(transaction) => transaction.status === "refunded",
		).length;
		const revenue = transactions
			.filter((transaction) => transaction.status === "completed")
			.reduce((sum, transaction) => sum + toNumber(transaction.totalAmount), 0);
		const completionRate =
			transactions.length > 0
				? Math.round((completed / transactions.length) * 100)
				: 0;
		const memberCount = transactions.filter(
			(transaction) => memberTypeOf(transaction) === "member",
		).length;
		return {
			total,
			completed,
			pending,
			cancelled,
			refunded,
			revenue,
			completionRate,
			memberCount,
		};
	}, [transactions, meta]);

	return {
		transactions,
		meta,
		loading,
		error,
		fetchTransactions,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
	};
}
