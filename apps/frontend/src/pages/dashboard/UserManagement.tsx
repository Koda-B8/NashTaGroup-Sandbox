import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "../../components/ui/button";
import ErrorBanner from "../../components/ui/error-banner";
import FilterPills from "../../components/ui/filter-pills";
import Input from "../../components/ui/input";
import ListToolbar from "../../components/ui/list-toolbar";
import Section from "../../components/ui/section";
import Toast from "../../components/ui/toast";
import RegisterUserModal from "../../features/users/components/RegisterUserModal";
import UserDetailPanel from "../../features/users/components/UserDetailPanel";
import UserOverview from "../../features/users/components/UserOverview";
import UserTable from "../../features/users/components/UserTable";
import {
	useUsersList,
	type RoleFilter,
} from "../../features/users/hooks/useUsersList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFlash } from "../../hooks/useFlash";
import { useRowSelection, useSelectedItem } from "../../hooks/useRowSelection";

type StatusFilter = "All" | "Active" | "Inactive";

const STATUS_ITEMS = [
	{ label: "All", value: "All" },
	{ label: "Active", value: "Active" },
	{ label: "Inactive", value: "Inactive" },
];

const ROLE_ITEMS = [
	{ label: "All", value: "All" },
	{ label: "Admin", value: "admin" },
	{ label: "Cashier", value: "cashier" },
];

export default function UserManagementDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
	const [page, setPage] = useState(0);
	const [showRegister, setShowRegister] = useState(false);
	const pageSize = 8;

	const { flash, show, clear } = useFlash(3000);

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

	const {
		selectedId,
		setSelectedId,
		selectedIds,
		allPageSelected,
		somePageSelected,
		toggleAllPage,
		toggleOne,
	} = useRowSelection(paged, users.length, { autoSelectFirstRow: true });

	const selected = useSelectedItem(users, selectedId, paged[0] ?? users[0]);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter, roleFilter]);

	const handleStatusChange = useCallback(
		(v: string) => setStatusFilter(v as StatusFilter),
		[],
	);
	const handleRoleChange = useCallback(
		(v: string) => setRoleFilter(v as RoleFilter),
		[],
	);
	const handleShowRegister = useCallback(() => setShowRegister(true), []);
	const handleRegisterSuccess = useCallback(() => {
		show("User created successfully");
		fetchUsers();
	}, [show, fetchUsers]);

	const totalLabel = useMemo(
		() =>
			`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : filtered.length} users`,
		[paged.length, isServerPaginated, server.totalItems, filtered.length],
	);

	return (
		<div className="flex flex-col gap-6">
			<Toast
				message={flash?.message}
				variant={flash?.variant}
				onDismiss={clear}
			/>
			{error && (
				<ErrorBanner
					message={error}
					onRetry={fetchUsers}
				/>
			)}

			<UserOverview
				users={users}
				meta={meta}
				loading={loading}
			/>

			<Section title="Users">
				<ListToolbar
					filters={
						<>
							<Input
								size="sm"
								placeholder="Search user..."
								value={search}
								onChange={(e) => setSearch(e.currentTarget.value)}
								className="w-full sm:max-w-[240px]"
								aria-label="Search user"
							/>
							<FilterPills
								label="Filter user by status"
								items={STATUS_ITEMS}
								value={statusFilter}
								onValueChange={handleStatusChange}
							/>
							<FilterPills
								label="Filter user by role"
								items={ROLE_ITEMS}
								value={roleFilter}
								onValueChange={handleRoleChange}
							/>
						</>
					}
					actions={
						<Button
							size="sm"
							onClick={handleShowRegister}
						>
							<Plus size={14} />
							Register Cashier
						</Button>
					}
				/>

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
						onPageChange={setPage}
						totalLabel={totalLabel}
					/>
					<UserDetailPanel user={selected} />
				</div>
			</Section>

			<RegisterUserModal
				open={showRegister}
				onOpenChange={setShowRegister}
				onSuccess={handleRegisterSuccess}
			/>
		</div>
	);
}
