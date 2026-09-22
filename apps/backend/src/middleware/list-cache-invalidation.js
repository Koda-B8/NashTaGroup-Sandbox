import { invalidateListCache } from "../lib/list-cache.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PRODUCT_PATHS = new Set([
	"products",
	"product-items",
	"product-images",
	"inventories",
	"checkout",
	"categories",
	"brands",
]);

export function listScopesForWrite(method, path) {
	if (!WRITE_METHODS.has(method)) return [];
	const resource = path.split("/")[1];
	const scopes = [];
	if (PRODUCT_PATHS.has(resource)) scopes.push("products");
	if (resource === "checkout") scopes.push("customers");
	if (resource === "users") scopes.push("users");
	if (resource === "brands") scopes.push("brands");
	if (resource === "categories") scopes.push("categories");
	return scopes;
}

export default function listCacheInvalidation(request, response, next) {
	const scopes = listScopesForWrite(request.method, request.path);
	if (scopes.length > 0) {
		response.once("finish", () => {
			if (response.statusCode >= 200 && response.statusCode < 300) {
				for (const scope of scopes) {
					invalidateListCache(scope).catch(() => {});
				}
			}
		});
	}
	return next();
}
