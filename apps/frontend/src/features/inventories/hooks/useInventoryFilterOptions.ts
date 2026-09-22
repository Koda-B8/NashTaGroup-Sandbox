import { useCallback, useEffect, useState } from "react";

import { listBrands } from "../../brands/api";
import { listCategories } from "../../categories/api";

export interface FilterOption {
	label: string;
	value: string;
}

export function useInventoryFilterOptions() {
	const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);
	const [brandOptions, setBrandOptions] = useState<FilterOption[]>([]);
	const [loading, setLoading] = useState(true);

	const loadOptions = useCallback(async () => {
		setLoading(true);
		const [categoriesResult, brandsResult] = await Promise.allSettled([
			listCategories({ isActive: true, limit: 100 }),
			listBrands({ isActive: true, limit: 100 }),
		]);
		setCategoryOptions(
			categoriesResult.status === "fulfilled"
				? categoriesResult.value.data.map((category) => ({
						label: category.name,
						value: category.id,
					}))
				: [],
		);
		setBrandOptions(
			brandsResult.status === "fulfilled"
				? brandsResult.value.data.map((brand) => ({
						label: brand.name,
						value: brand.id,
					}))
				: [],
		);
		setLoading(false);
	}, []);

	useEffect(() => {
		queueMicrotask(() => void loadOptions());
	}, [loadOptions]);

	return {
		categoryOptions,
		brandOptions,
		loading,
		reloadOptions: loadOptions,
	};
}
