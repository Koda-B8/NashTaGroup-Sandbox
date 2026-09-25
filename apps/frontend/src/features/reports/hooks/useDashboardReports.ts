import { useCallback, useEffect, useMemo, useState } from "react";

import {
	type CashierReport,
	getCashierReport,
	getCustomerReport,
	getPaymentMethodReport,
	getProductReport,
	getSalesReport,
	type CustomerReport,
	type PaymentMethodReport,
	type ProductReport,
	type SalesReport,
} from "../api";
import {
	periodForTimeRange,
	rangeForTimeRange,
	type TimeRange,
} from "../format";

export interface DashboardReports {
	sales: SalesReport | null;
	products: ProductReport | null;
	paymentMethods: PaymentMethodReport | null;
	cashiers: CashierReport | null;
	customers: CustomerReport | null;
}

const EMPTY: DashboardReports = {
	sales: null,
	products: null,
	paymentMethods: null,
	cashiers: null,
	customers: null,
};

export function useDashboardReports(range: TimeRange) {
	const [data, setData] = useState<DashboardReports>(EMPTY);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const now = useMemo(() => new Date(), []);
	const { from, to } = useMemo(
		() => rangeForTimeRange(range, now),
		[range, now],
	);
	const period = periodForTimeRange(range);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		const results = await Promise.allSettled([
			getSalesReport({ from, to, period, limit: 100 }),
			getProductReport({ from, to, limit: 5 }),
			getPaymentMethodReport({ from, to, limit: 100 }),
			getCashierReport({ from, to, limit: 5 }),
			getCustomerReport({ from, to, limit: 1 }),
		]);
		const [sales, products, paymentMethods, cashiers, customers] = results;
		setData({
			sales: sales.status === "fulfilled" ? sales.value.data : null,
			products: products.status === "fulfilled" ? products.value.data : null,
			paymentMethods:
				paymentMethods.status === "fulfilled"
					? paymentMethods.value.data
					: null,
			cashiers: cashiers.status === "fulfilled" ? cashiers.value.data : null,
			customers: customers.status === "fulfilled" ? customers.value.data : null,
		});
		const failed = results.filter((result) => result.status === "rejected");
		if (failed.length === results.length) {
			setError("Gagal memuat data dashboard. Periksa koneksi lalu coba lagi.");
		} else if (failed.length > 0) {
			setError(
				`${failed.length} dari ${results.length} data dashboard gagal dimuat.`,
			);
		}
		setLoading(false);
	}, [from, to, period]);

	useEffect(() => {
		queueMicrotask(() => void load());
	}, [load]);

	return { ...data, loading, error, reload: load, range: { from, to, period } };
}
