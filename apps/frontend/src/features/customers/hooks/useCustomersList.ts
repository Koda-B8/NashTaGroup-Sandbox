import { useMemo } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import { listCustomers, type Customer } from "../api";

export function useCustomersList(params: {
	debouncedSearch: string;
	page: number;
	pageSize: number;
}) {
	const { debouncedSearch, page, pageSize } = params;

	const {
		items: customers,
		meta,
		loading,
		error,
		fetchList: fetchCustomers,
		server,
		isServerPaginated,
		filtered,
		paged,
		pageCount,
		safePage,
	} = usePaginatedList<Customer, { search?: string }>({
		fetcher: listCustomers,
		params: {
			search: debouncedSearch || undefined,
		},
		page,
		pageSize,
	});

	const customersMemo = useMemo(() => customers, [customers]);

	return {
		customers: customersMemo,
		meta,
		loading,
		error,
		fetchCustomers,
		server,
		isServerPaginated,
		filtered,
		paged,
		pageCount,
		safePage,
	};
}
