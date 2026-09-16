import { useCallback, useEffect, useRef, useState } from "react";

import { getTransaction, type TransactionDetail } from "../api";

export function useTransactionDetail(id: string | undefined) {
	const [detail, setDetail] = useState<TransactionDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const requestRef = useRef(0);

	const fetchDetail = useCallback(async () => {
		if (!id) {
			setDetail(null);
			setError(null);
			setLoading(false);
			return;
		}
		const requestId = ++requestRef.current;
		setLoading(true);
		setError(null);
		setDetail(null);
		try {
			const data = await getTransaction(id);
			if (requestId !== requestRef.current) return;
			setDetail(data);
		} catch (error) {
			if (requestId !== requestRef.current) return;
			setError(
				error instanceof Error ? error.message : "Terjadi kesalahan jaringan",
			);
		} finally {
			if (requestId === requestRef.current) setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		queueMicrotask(() => void fetchDetail());
	}, [fetchDetail]);

	return { detail, loading, error, fetchDetail };
}
