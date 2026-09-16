import { useCallback, useEffect, useMemo, useState } from "react";

import { listUsers } from "../../users/api";
import { listPaymentMethods, type Transaction } from "../api";

export interface FilterOption {
	label: string;
	value: string;
	description?: string;
}

export function useTransactionFilterOptions(transactions: Transaction[]) {
	const [cashierOptions, setCashierOptions] = useState<FilterOption[]>([]);
	const [paymentMethodOptions, setPaymentMethodOptions] = useState<
		FilterOption[]
	>([]);
	const [loading, setLoading] = useState(true);

	const loadOptions = useCallback(async () => {
		setLoading(true);
		const [usersResult, methodsResult] = await Promise.allSettled([
			listUsers({ role: "cashier", limit: 100 }),
			listPaymentMethods({ is_active: true }),
		]);
		setCashierOptions(
			usersResult.status === "fulfilled"
				? usersResult.value.data.map((user) => ({
						label: user.fullname,
						value: user.id,
						description: `@${user.username}`,
					}))
				: [],
		);
		setPaymentMethodOptions(
			methodsResult.status === "fulfilled"
				? methodsResult.value.map((method) => ({
						label: method.name,
						value: method.id,
						description: method.code ?? method.type ?? undefined,
					}))
				: [],
		);
		setLoading(false);
	}, []);

	useEffect(() => {
		queueMicrotask(() => void loadOptions());
	}, [loadOptions]);

	const customerOptions = useMemo<FilterOption[]>(() => {
		const seen = new Map<string, string>();
		for (const transaction of transactions) {
			const customer = transaction.customer;
			if (!customer) continue;
			seen.set(customer.id, customer.name ?? customer.phone ?? customer.id);
		}
		return [...seen].map(([value, label]) => ({ value, label }));
	}, [transactions]);

	return {
		cashierOptions,
		paymentMethodOptions,
		customerOptions,
		loading,
		reloadOptions: loadOptions,
	};
}
