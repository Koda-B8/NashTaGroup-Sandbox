import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import RegisterUserModal from "../../components/dashboard/users/RegisterUserModal";
import UserDetailPanel from "../../components/dashboard/users/UserDetailPanel";
import UserOverview from "../../components/dashboard/users/UserOverview";
import UserTable from "../../components/dashboard/users/UserTable";
import Button from "../../components/ui/button";
import FilterPills from "../../components/ui/filter-pills";
import Input from "../../components/ui/input";
import {
	useUsersList,
	type RoleFilter,
} from "../../features/users/hooks/useUsersList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

type StatusFilter = "All" | "Active" | "Inactive";

export default function UserManagementDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
	const [page, setPage] = useState(0);
	const pageSize = 8;

	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [showRegister, setShowRegister] = useState(false);
	const [toast, setToast] = useState<string | undefined>(undefined);

	const {
		users,
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
	} = useUsersList({
		debouncedSearch,
		statusFilter,
		roleFilter,
		page,
		pageSize,
	});

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter, roleFilter]);

	useEffect(() => {
		queueMicrotask(() => {
			if (paged.length > 0) {
				setSelectedId((prev) =>
					prev && paged.some((u) => u.id === prev) ? prev : paged[0]!.id,
				);
				setSelectedIds((prev) =>
					prev.size > 0 ? prev : new Set([paged[0]!.id]),
				);
			} else if (users.length === 0) {
				setSelectedId(undefined);
			}
		});
	}, [paged, users.length]);

	const selected = useMemo(() => {
		if (!selectedId) return paged[0] ?? users[0] ?? undefined;
		return (
			users.find((u) => u.id === selectedId) ??
			paged[0] ??
			users[0] ??
			undefined
		);
	}, [selectedId, paged, users]);

	const allPageSelected = useMemo(
		() => paged.length > 0 && paged.every((u) => selectedIds.has(u.id)),
		[paged, selectedIds],
	);
	const somePageSelected = useMemo(
		() => paged.some((u) => selectedIds.has(u.id)) && !allPageSelected,
		[paged, selectedIds, allPageSelected],
	);

	const toggleAllPage = useCallback(
		(checked: boolean) =>
			setSelectedIds((prev) => {
				const n = new Set(prev);
				if (checked) paged.forEach((u) => n.add(u.id));
				else paged.forEach((u) => n.delete(u.id));
				return n;
			}),
		[paged],
	);
	const toggleOne = useCallback(
		(id: string, checked: boolean) =>
			setSelectedIds((prev) => {
				const n = new Set(prev);
				if (checked) n.add(id);
				else n.delete(id);
				return n;
			}),
		[],
	);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) =>
			setSearch(e.currentTarget.value),
		[],
	);
	const statusItems = useMemo(
		() => [
			{ label: "All", value: "All" },
			{ label: "Active", value: "Active" },
			{ label: "Inactive", value: "Inactive" },
		],
		[],
	);
	const roleItems = useMemo(
		() => [
			{ label: "All", value: "All" },
			{ label: "Admin", value: "admin" },
			{ label: "Cashier", value: "cashier" },
		],
		[],
	);
	const handleStatusChange = useCallback(
		(v: string) => setStatusFilter(v as StatusFilter),
		[],
	);
	const handleRoleChange = useCallback(
		(v: string) => setRoleFilter(v as RoleFilter),
		[],
	);
	const handleShowRegister = useCallback(() => setShowRegister(true), []);
	const handlePageChange = useCallback((p: number) => setPage(p), []);
	const handleRegisterSuccess = useCallback(() => {
		setToast("User created successfully");
		setTimeout(() => setToast(undefined), 3000);
		fetchUsers();
	}, [fetchUsers]);
	const totalLabel = useMemo(
		() =>
			`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : filtered.length} users`,
		[paged.length, isServerPaginated, server.totalItems, filtered.length],
	);

	return (
		<div className="flex flex-col gap-6">
			{toast && (
				<div
					className="rounded-lg border border-valid bg-valid px-4 py-2 text-sm text-deep-valid"
					role="status"
				>
					{toast}
				</div>
			)}
			{error && (
				<div
					className="rounded-lg border border-danger bg-danger px-4 py-3 text-sm text-deep-danger"
					role="alert"
				>
					{error}{" "}
					<button
						type="button"
						onClick={fetchUsers}
						className="ml-2 font-semibold underline"
					>
						Coba lagi
					</button>
				</div>
			)}

			<UserOverview
				users={users}
				meta={meta}
				loading={loading}
			/>

			<section
				aria-labelledby="cashiers-heading"
				className="flex flex-col gap-3"
			>
				<h2
					id="cashiers-heading"
					className="text-[11px] font-semibold tracking-wider text-text uppercase"
				>
					Users
				</h2>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
					<div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
						<Input
							size="sm"
							placeholder="Search user..."
							value={search}
							onChange={handleSearchChange}
							className="w-full sm:max-w-[240px]"
							aria-label="Search user"
						/>
						<FilterPills
							label="Filter user by status"
							items={statusItems}
							value={statusFilter}
							onValueChange={handleStatusChange}
						/>
						<FilterPills
							label="Filter user by role"
							items={roleItems}
							value={roleFilter}
							onValueChange={handleRoleChange}
						/>
					</div>
					<Button
						size="sm"
						onClick={handleShowRegister}
					>
						<Plus size={14} />
						Register Cashier
					</Button>
				</div>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
					<UserTable
						loading={loading}
						paged={paged}
						selectedId={selected?.id}
						selectedIds={selectedIds}
						allPageSelected={allPageSelected}
						somePageSelected={somePageSelected}
						onSelect={setSelectedId}
						onToggleAll={toggleAllPage}
						onToggleOne={toggleOne}
						pageCount={pageCount}
						safePage={safePage}
						onPageChange={handlePageChange}
						totalLabel={totalLabel}
					/>
					<UserDetailPanel user={selected} />
				</div>
			</section>

			<RegisterUserModal
				open={showRegister}
				onOpenChange={setShowRegister}
				onSuccess={handleRegisterSuccess}
			/>
		</div>
	);
}
