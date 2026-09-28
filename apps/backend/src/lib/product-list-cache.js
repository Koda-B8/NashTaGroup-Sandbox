import { invalidateListCache, listCacheKey } from "./list-cache.js";

export {
	readListCache as readProductListCache,
	writeListCache as writeProductListCache,
} from "./list-cache.js";

export const productListCacheKey = (filters) =>
	listCacheKey("products", filters);
export const invalidateProductListCache = () => invalidateListCache("products");
