import { useCallback, useMemo } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import { getRoleName } from "../../../libs/format";
import { listUsers, type User } from "../../../services/users";

type StatusFilter = "All" | "Active" | "Inactive";
type RoleFilter = "All" | "admin" | "cashier";

export function useUsersList(params: {
	debouncedSearch: string;
	statusFilter: StatusFilter;
	roleFilter: RoleFilter;
	page: number;
	pageSize: number;
}) {
	const { debouncedSearch, statusFilter, roleFilter, page, pageSize } = params;

	const clientFilter = useCallback(
		(items: User[]) => {
			const q = debouncedSearch.trim().toLowerCase();
			return items.filter((u) => {
				if (q) {
					const hay = `${u.fullname} ${u.username}`.toLowerCase();
					if (!hay.includes(q)) return false;
				}
				if (statusFilter !== "All") {
					const wantActive = statusFilter === "Active";
					if (u.isActive !== wantActive) return false;
				}
				if (roleFilter !== "All") {
					if (getRoleName(u.role).toLowerCase() !== roleFilter) return false;
				}
				return true;
			});
		},
		[debouncedSearch, statusFilter, roleFilter],
	);

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
	} = usePaginatedList<
		User,
		{ search?: string; isActive?: boolean; role?: "admin" | "cashier" }
	>({
		fetcher: listUsers,
		params: {
			search: debouncedSearch || undefined,
			isActive:
				statusFilter === "Active"
					? true
					: (statusFilter === "Inactive"
						? false
						: undefined),
			role: roleFilter === "All" ? undefined : roleFilter,
		},
		page,
		pageSize,
		clientFilter,
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

export type { RoleFilter, StatusFilter };
