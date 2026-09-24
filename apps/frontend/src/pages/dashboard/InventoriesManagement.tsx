import { RefreshCwIcon, RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "../../components/ui/button";
import DatePicker from "../../components/ui/date-picker";
import ErrorBanner from "../../components/ui/error-banner";
import FilterPills from "../../components/ui/filter-pills";
import Input from "../../components/ui/input";
import Section from "../../components/ui/section";
import Select from "../../components/ui/select";
import StatCard, { StatGrid } from "../../components/ui/stat-card";
import InventoryMovementsTable from "../../features/inventories/components/InventoryMovementsTable";
import MovementDetailPanel from "../../features/inventories/components/MovementDetailPanel";
import {
	MOVEMENT_SORT_OPTIONS,
	MOVEMENT_TYPE_OPTIONS,
	type MovementSortBy,
	type MovementTypeFilter,
} from "../../features/inventories/format";
import { useInventoryMovements } from "../../features/inventories/hooks/useInventoryMovements";
import { useMovementStats } from "../../features/inventories/hooks/useMovementStats";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useRowSelection, useSelectedItem } from "../../hooks/useRowSelection";

function FilterField({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-2xs font-semibold tracking-wider text-text uppercase">
				{label}
			</span>
			{children}
		</div>
	);
}

export default function InventoriesManagementDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [typeFilter, setTypeFilter] = useState<MovementTypeFilter>("All");
	const [fromMonth, setFromMonth] = useState("");
	const [toMonth, setToMonth] = useState("");
	const [sortBy, setSortBy] = useState<MovementSortBy>("newest");
	const [page, setPage] = useState(0);
	const pageSize = 10;

	const {
		movements,
		loading,
		error: fetchError,
		fetchMovements,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
	} = useInventoryMovements({
		debouncedSearch,
		typeFilter,
		fromMonth,
		toMonth,
		sortBy,
		page,
		pageSize,
	});

	const { stats, loading: statsLoading, reloadStats } = useMovementStats();

	const {
		selectedId,
		setSelectedId,
		selectedIds,
		allPageSelected,
		somePageSelected,
		toggleAllPage,
		toggleOne,
	} = useRowSelection(paged, movements.length);

	const selected = useSelectedItem(movements, selectedId, sorted[0] ?? null);

	const activeFilterCount = useMemo(
		() =>
			[
				debouncedSearch ? 1 : 0,
				typeFilter === "All" ? 0 : 1,
				fromMonth ? 1 : 0,
				toMonth ? 1 : 0,
			].reduce((sum, value) => sum + value, 0),
		[debouncedSearch, typeFilter, fromMonth, toMonth],
	);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, typeFilter, fromMonth, toMonth]);

	const handleReset = useCallback(() => {
		setSearch("");
		setTypeFilter("All");
		setFromMonth("");
		setToMonth("");
	}, []);

	const handleRefresh = useCallback(() => {
		fetchMovements();
		reloadStats();
	}, [fetchMovements, reloadStats]);

	const totalLabel = `Showing ${paged.length} of ${
		isServerPaginated ? server.totalItems : sorted.length
	} movements`;

	return (
		<div className="flex flex-col gap-6">
			{fetchError && (
				<ErrorBanner
					message={fetchError}
					onRetry={fetchMovements}
				/>
			)}

			<Section title="Overview">
				<StatGrid>
					<StatCard
						loading={statsLoading}
						label="Total Movements"
						value={stats.total}
						note="Seluruh pergerakan stok"
					/>
					<StatCard
						loading={statsLoading}
						label="Additions"
						value={stats.additions}
						note="Stok masuk"
					/>
					<StatCard
						loading={statsLoading}
						label="Reductions"
						value={stats.reductions}
						note="Stok keluar"
					/>
					<StatCard
						loading={statsLoading}
						label="Corrections"
						value={stats.corrections}
						note="Koreksi manual"
					/>
				</StatGrid>
			</Section>

			<Section
				title="Inventory Movements"
				className="@container"
			>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
						<Input
							size="sm"
							placeholder="Search product, variant, or code..."
							value={search}
							onChange={(event) => setSearch(event.currentTarget.value)}
							className="w-full shrink-0 sm:max-w-[248px]"
							aria-label="Search inventory movements"
						/>
						<FilterPills
							variant="segmented"
							label="Filter by movement type"
							items={MOVEMENT_TYPE_OPTIONS}
							value={typeFilter}
							onValueChange={(value) =>
								setTypeFilter(value as MovementTypeFilter)
							}
							className="shrink-0"
						/>
						<div className="flex shrink-0 items-center gap-2 sm:ml-auto">
							<Select
								label="Sort movements"
								value={sortBy}
								onValueChange={(value) => setSortBy(value as MovementSortBy)}
								items={MOVEMENT_SORT_OPTIONS}
								className="h-8 w-40 min-w-0 text-xs"
								placeholder="Sort"
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={handleRefresh}
								disabled={loading || statsLoading}
							>
								<RefreshCwIcon
									size={14}
									className={loading || statsLoading ? "animate-spin" : ""}
								/>
								Refresh
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
						<FilterField label="From month">
							<DatePicker
								label="Filter movements from month"
								value={fromMonth}
								onValueChange={setFromMonth}
								size="sm"
								className="w-full min-w-0"
								placeholder="All months"
							/>
						</FilterField>
						<FilterField label="To month">
							<DatePicker
								label="Filter movements to month"
								value={toMonth}
								onValueChange={setToMonth}
								size="sm"
								className="w-full min-w-0"
								placeholder="All months"
							/>
						</FilterField>
						<div className="flex items-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleReset}
								disabled={activeFilterCount === 0}
								block
							>
								<RotateCcwIcon size={14} />
								Reset{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
							</Button>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 @6xl:grid-cols-[1fr_320px]">
					<InventoryMovementsTable
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
					<MovementDetailPanel movement={selected ?? undefined} />
				</div>
			</Section>
		</div>
	);
}
