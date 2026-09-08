const products = [
	{
		name: "Samsung Galaxy A55",
		category_name: "Smartphone",
		brand_name: "Samsung",
		description: "Smartphone Samsung Galaxy A55.",
	},
	{
		name: "iPhone 15",
		category_name: "Smartphone",
		brand_name: "Apple",
		description: "Smartphone Apple iPhone 15.",
	},
	{
		name: "ASUS Vivobook 14",
		category_name: "Laptop",
		brand_name: "ASUS",
		description: "Laptop ASUS Vivobook 14.",
	},
	{
		name: "Lenovo IdeaPad Slim 3",
		category_name: "Laptop",
		brand_name: "Lenovo",
		description: "Laptop Lenovo IdeaPad Slim 3.",
	},
	{
		name: "LG UHD TV 43 Inch",
		category_name: "Televisi",
		brand_name: "LG",
		description: "Televisi LG UHD 43 Inch.",
	},
	{
		name: "Sony WH-CH520",
		category_name: "Audio",
		brand_name: "Sony",
		description: "Headphone wireless Sony WH-CH520.",
	},
	{
		name: "Xiaomi Redmi Note 14",
		category_name: "Smartphone",
		brand_name: "Xiaomi",
		description: "Smartphone Xiaomi Redmi Note 14.",
	},
];

const categoryNames = [
	...new Set(products.map((product) => product.category_name)),
];
const brandNames = [...new Set(products.map((product) => product.brand_name))];
const productNames = products.map((product) => product.name);

module.exports = {
	async up(queryInterface, { QueryTypes }) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			const categories = await queryInterface.sequelize.query(
				"SELECT id, name FROM categories WHERE name IN (:names)",
				{
					replacements: { names: categoryNames },
					type: QueryTypes.SELECT,
					transaction,
				},
			);

			const brands = await queryInterface.sequelize.query(
				"SELECT id, name FROM brands WHERE name IN (:names)",
				{
					replacements: { names: brandNames },
					type: QueryTypes.SELECT,
					transaction,
				},
			);

			const categoryId = Object.fromEntries(
				categories.map((category) => [category.name, category.id]),
			);
			const brandId = Object.fromEntries(
				brands.map((brand) => [brand.name, brand.id]),
			);

			const missingCategories = categoryNames.filter(
				(name) => !categoryId[name],
			);
			const missingBrands = brandNames.filter((name) => !brandId[name]);

			if (missingCategories.length > 0 || missingBrands.length > 0) {
				throw new Error(
					`Cannot seed products: missing category(s): ${missingCategories.join(", ") || "-"}; missing brand(s): ${missingBrands.join(", ") || "-"}.`,
				);
			}

			const now = new Date();

			await queryInterface.bulkInsert(
				"products",
				products.map((product) => ({
					category_id: categoryId[product.category_name],
					brand_id: brandId[product.brand_name],
					name: product.name,
					description: product.description,
					is_active: true,
					created_at: now,
					updated_at: now,
				})),
				{ transaction },
			);
		});
	},

	async down(queryInterface, { Op }) {
		await queryInterface.bulkDelete("products", {
			name: { [Op.in]: productNames },
		});
	},
};
