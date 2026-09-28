import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import ErrorBanner from "../../components/ui/error-banner";
import ListToolbar, { ListSearch } from "../../components/ui/list-toolbar";
import Section from "../../components/ui/section";
import Toast from "../../components/ui/toast";
import type { Customer } from "../../features/customers/api";
import CustomerDetailModal from "../../features/customers/components/CustomerDetailModal";
import CustomerOverview from "../../features/customers/components/CustomerOverview";
import CustomerTable from "../../features/customers/components/CustomerTable";
import { useCustomersList } from "../../features/customers/hooks/useCustomersList";
import CustomerTransactionReportModal from "../../features/reports/components/CustomerTransactionReportModal";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFlash } from "../../hooks/useFlash";
import type { RootState } from "../../store";

export default function CustomersDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [page, setPage] = useState(0);
	const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
	const [reportCustomer, setReportCustomer] = useState<Customer | null>(null);
	const pageSize = 8;

	const user = useSelector((state: RootState) => state.auth.user);
	const { flash, show, clear } = useFlash(3000);

	const {
		customers,
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
	} = useCustomersList({ debouncedSearch, page, pageSize });

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch]);

	const handleViewDetail = useCallback((customer: Customer) => {
		setDetailCustomer(customer);
	}, []);

	const handleDetailOpenChange = useCallback((open: boolean) => {
		if (!open) setDetailCustomer(null);
	}, []);

	const handleViewReport = useCallback((customer: Customer) => {
		setReportCustomer(customer);
	}, []);

	const handleReportOpenChange = useCallback((open: boolean) => {
		if (!open) setReportCustomer(null);
	}, []);

	const totalLabel = useMemo(
		() =>
			`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : filtered.length} customers`,
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
					onRetry={fetchCustomers}
				/>
			)}

			<CustomerOverview
				customers={customers}
				meta={meta}
				loading={loading}
			/>

			<Section title="Customers">
				<ListToolbar
					filters={
						<ListSearch
							placeholder="Search name or phone..."
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
							aria-label="Search customers"
						/>
					}
				/>

				<CustomerTable
					loading={loading}
					paged={paged}
					onViewDetail={handleViewDetail}
					onViewReport={handleViewReport}
					pageCount={pageCount}
					safePage={safePage}
					onPageChange={setPage}
					totalLabel={totalLabel}
				/>
			</Section>

			<CustomerDetailModal
				open={Boolean(detailCustomer)}
				onOpenChange={handleDetailOpenChange}
				customer={detailCustomer}
			/>

			<CustomerTransactionReportModal
				open={Boolean(reportCustomer)}
				onOpenChange={handleReportOpenChange}
				generatedBy={user?.fullname ?? "Admin"}
				onNotify={show}
				customer={
					reportCustomer
						? { id: reportCustomer.id, name: reportCustomer.name }
						: null
				}
			/>
		</div>
	);
}
