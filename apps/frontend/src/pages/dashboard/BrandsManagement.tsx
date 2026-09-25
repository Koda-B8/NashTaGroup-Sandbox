import { type Brand, deleteBrand } from "../../features/brands/api";
import BrandDetailPanel from "../../features/brands/components/BrandDetailPanel";
import BrandFormModal from "../../features/brands/components/BrandFormModal";
import BrandOverview from "../../features/brands/components/BrandOverview";
import BrandTable from "../../features/brands/components/BrandTable";
import {
	type BrandStats,
	useBrandsList,
} from "../../features/brands/hooks/useBrandsList";
import CatalogDashboard, { type CatalogConfig } from "./CatalogManagement";

type Config = CatalogConfig<Brand, BrandStats>;

function useList(params: Parameters<typeof useBrandsList>[0]) {
	const list = useBrandsList(params);
	return { ...list, items: list.brands, refetch: list.fetchBrands };
}

const Detail: Config["Detail"] = ({ item, ...props }) => (
	<BrandDetailPanel
		brand={item}
		{...props}
	/>
);

const Form: Config["Form"] = ({ item, ...props }) => (
	<BrandFormModal
		brand={item}
		{...props}
	/>
);

export default function BrandsDashboard() {
	return (
		<CatalogDashboard
			noun="Brand"
			title="Brands"
			useList={useList}
			remove={deleteBrand}
			Overview={BrandOverview}
			Table={BrandTable}
			Detail={Detail}
			Form={Form}
		/>
	);
}
