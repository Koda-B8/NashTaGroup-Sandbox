import { type Category, deleteCategory } from "../../features/categories/api";
import CategoryDetailPanel from "../../features/categories/components/CategoryDetailPanel";
import CategoryFormModal from "../../features/categories/components/CategoryFormModal";
import CategoryOverview from "../../features/categories/components/CategoryOverview";
import CategoryTable from "../../features/categories/components/CategoryTable";
import {
	type CategoryStats,
	useCategoriesList,
} from "../../features/categories/hooks/useCategoriesList";
import CatalogDashboard, { type CatalogConfig } from "./CatalogManagement";

type Config = CatalogConfig<Category, CategoryStats>;

function useList(params: Parameters<typeof useCategoriesList>[0]) {
	const list = useCategoriesList(params);
	return { ...list, items: list.categories, refetch: list.fetchCategories };
}

const Detail: Config["Detail"] = ({ item, ...props }) => (
	<CategoryDetailPanel
		category={item}
		{...props}
	/>
);

const Form: Config["Form"] = ({ item, ...props }) => (
	<CategoryFormModal
		category={item}
		{...props}
	/>
);

export default function CategoriesDashboard() {
	return (
		<CatalogDashboard
			noun="Category"
			title="Categories"
			useList={useList}
			remove={deleteCategory}
			Overview={CategoryOverview}
			Table={CategoryTable}
			Detail={Detail}
			Form={Form}
		/>
	);
}
