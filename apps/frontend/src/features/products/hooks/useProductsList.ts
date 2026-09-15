import { useCallback, useMemo } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import { listProducts, type Product } from "../api";
import {
	priceRange,
	toNumber,
	type SortBy,
	type StatusFilter,
} from "../format";

export interface ProductStats {
	total: number;
	active: number;
	inactive: number;
	categories: number;
	brands: number;
	totalStock: number;
	inventoryValue: number;
	lowStock: number;
	activeRate: number;
}

export interface SelectOption {
	label: string;
	value: string;
}

export function useProductsList(params: {
	debouncedSearch: string;
	statusFilter: StatusFilter;
	sortBy: SortBy;
	page: number;
	pageSize: number;
}) {
	const { debouncedSearch, statusFilter, sortBy, page, pageSize } = params;

	const sortTransform = useCallback(
		(items: Product[]) =>
			[...items].sort((a, b) => {
				if (sortBy === "name_asc") return a.name.localeCompare(b.name);
				if (sortBy === "name_desc") return b.name.localeCompare(a.name);
				if (sortBy === "stock_desc")
					return toNumber(b.stock) - toNumber(a.stock);
				if (sortBy === "price_desc")
					return priceRange(b.items ?? []).max - priceRange(a.items ?? []).max;
				if (sortBy === "updated_desc")
					return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
				return 0;
			}),
		[sortBy],
	);

	const {
		items: products,
		meta,
		loading,
		error,
		fetchList: fetchProducts,
		server,
		isServerPaginated,
		filtered: sorted,
		paged,
		pageCount,
		safePage,
	} = usePaginatedList<Product, { search?: string; isActive?: boolean }>({
		fetcher: listProducts,
		params: {
			search: debouncedSearch || undefined,
			isActive:
				statusFilter === "Active"
					? true
					: statusFilter === "Inactive"
						? false
						: undefined,
		},
		page,
		pageSize,
		transform: sortTransform,
	});

	const stats = useMemo<ProductStats>(() => {
		const total = meta?.pagination.total_items ?? products.length;
		const active = products.filter((p) => p.isActive).length;
		const inactive = meta ? total - active : products.length - active;
		const categories = new Set(
			products.map((p) => p.category?.name ?? p.categoryId),
		);
		const brands = new Set(products.map((p) => p.brand?.name ?? p.brandId));
		const totalStock = products.reduce((sum, p) => sum + toNumber(p.stock), 0);
		let inventoryValue = 0;
		for (const product of products) {
			for (const item of product.items ?? []) {
				inventoryValue += toNumber(item.price) * toNumber(item.stock);
			}
		}
		const lowStock = products.filter((p) => toNumber(p.stock) <= 5).length;
		const activeRate = total ? Math.round((active / total) * 100) : 0;
		return {
			total,
			active,
			inactive,
			categories: categories.size,
			brands: brands.size,
			totalStock,
			inventoryValue,
			lowStock,
			activeRate,
		};
	}, [products, meta]);

	const categoryOptions = useMemo<SelectOption[]>(() => {
		const map = new Map<string, string>();
		products.forEach((p) => {
			if (p.categoryId) map.set(p.categoryId, p.category?.name ?? p.categoryId);
		});
		return [...map].map(([value, label]) => ({ value, label }));
	}, [products]);

	const brandOptions = useMemo<SelectOption[]>(() => {
		const map = new Map<string, string>();
		products.forEach((p) => {
			if (p.brandId) map.set(p.brandId, p.brand?.name ?? p.brandId);
		});
		return [...map].map(([value, label]) => ({ value, label }));
	}, [products]);

	return {
		products,
		meta,
		loading,
		error,
		fetchProducts,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
		categoryOptions,
		brandOptions,
	};
}
