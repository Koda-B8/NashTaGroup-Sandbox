import { useMemo } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import { listUsers, type User } from "../../../services/users";

type StatusFilter = "All" | "Active" | "Inactive";

export function useUsersList(params: {
	debouncedSearch: string;
	statusFilter: StatusFilter;
	page: number;
	pageSize: number;
}) {
	const { debouncedSearch, statusFilter, page, pageSize } = params;

	const {
		items: users,
		meta,
		loading,
		error,
		fetchList: fetchUsers,
		server,
		isServerPaginated,
		filtered,
		paged,
		pageCount,
		safePage,
	} = usePaginatedList<User, { search?: string; isActive?: boolean }>({
		fetcher: listUsers,
		params: {
			search: debouncedSearch || undefined,
			isActive:
				statusFilter === "Active"
					? true
					: statusFilter === "Inactive"
						? false
						: undefined,
		},
		page,
		pageSize,
	});

	const usersMemo = useMemo(() => users, [users]);

	return {
		users: usersMemo,
		meta,
		loading,
		error,
		fetchUsers,
		server,
		isServerPaginated,
		filtered,
		paged,
		pageCount,
		safePage,
	};
}
