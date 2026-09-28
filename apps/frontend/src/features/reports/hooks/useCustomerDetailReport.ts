import { useCallback, useEffect, useState } from "react";

import type { ApiMeta } from "../../../types/pagination";
import { monthEnd, monthStart } from "../../inventories/format";
import {
	getCustomerDetailReport,
	type CustomerDetailReport,
	type CustomerDetailView,
} from "../api";

export function useCustomerDetailReport(params: {
	customerId: string;
	view: CustomerDetailView;
	fromMonth: string;
	toMonth: string;
	page: number;
	pageSize: number;
}) {
	const { customerId, view, fromMonth, toMonth, page, pageSize } = params;
	const [report, setReport] = useState<CustomerDetailReport | null>(null);
	const [meta, setMeta] = useState<ApiMeta | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	const fetchReport = useCallback(
		() => setReloadToken((token) => token + 1),
		[],
	);

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const { data, meta: responseMeta } = await getCustomerDetailReport(
					customerId,
					{
						view,
						from: monthStart(fromMonth),
						to: monthEnd(toMonth),
						page: page + 1,
						limit: pageSize,
					},
				);
				if (cancelled) return;
				setReport(data);
				setMeta(responseMeta);
			} catch (fetchError) {
				if (!cancelled)
					setError(
						fetchError instanceof Error
							? fetchError.message
							: "Terjadi kesalahan jaringan",
					);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		queueMicrotask(() => void run());
		return () => {
			cancelled = true;
		};
	}, [customerId, view, fromMonth, toMonth, page, pageSize, reloadToken]);

	return { report, meta, loading, error, fetchReport };
}
