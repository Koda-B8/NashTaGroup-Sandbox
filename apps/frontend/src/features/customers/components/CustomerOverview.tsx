import Section from "../../../components/ui/section";
import StatCard, { StatGrid } from "../../../components/ui/stat-card";
import { formatDate } from "../../../libs/format";
import type { ApiMeta } from "../../../types/pagination";
import type { Customer } from "../api";

export default function CustomerOverview({
	customers,
	meta,
	loading,
}: {
	customers: Customer[];
	meta: ApiMeta | null;
	loading: boolean;
}) {
	const totalCustomers = meta?.pagination.total_items ?? customers.length;
	const withPhone = customers.filter((c) => c.phone).length;
	const newest = customers.reduce<Customer | undefined>((latest, customer) => {
		if (!latest) return customer;
		return new Date(customer.createdAt) > new Date(latest.createdAt)
			? customer
			: latest;
	}, undefined);

	return (
		<Section title="Overview">
			<StatGrid>
				<StatCard
					loading={loading}
					label="Total Customers"
					value={totalCustomers}
					note={`${customers.length} on this page`}
				/>
				<StatCard
					loading={loading}
					label="On This Page"
					value={customers.length}
					note={`${withPhone} with phone`}
				/>
				<StatCard
					loading={loading}
					label="Newest Customer"
					value={newest?.name ?? "—"}
					note={newest ? formatDate(newest.createdAt) : "—"}
				/>
				<StatCard
					loading={loading}
					label="With Phone"
					value={withPhone}
					note={`${customers.length - withPhone} without phone`}
				/>
			</StatGrid>
		</Section>
	);
}
