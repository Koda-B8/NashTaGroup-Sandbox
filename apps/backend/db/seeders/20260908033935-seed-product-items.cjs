const productItems = [
	{
		product_name: "Samsung Galaxy A55",
		product_code: "SAM-A55-8-128-BLU",
		name: "8GB / 128GB - Blue",
		price: "5999000.00",
	},
	{
		product_name: "Samsung Galaxy A55",
		product_code: "SAM-A55-8-256-NVY",
		name: "8GB / 256GB - Navy",
		price: "6499000.00",
	},
	{
		product_name: "iPhone 15",
		product_code: "APL-IP15-128-BLK",
		name: "128GB - Black",
		price: "11999000.00",
	},
	{
		product_name: "ASUS Vivobook 14",
		product_code: "ASU-VB14-I5-512",
		name: "Core i5 / 16GB / 512GB SSD",
		price: "10999000.00",
	},
	{
		product_name: "Lenovo IdeaPad Slim 3",
		product_code: "LEN-IPS3-R5-512",
		name: "Ryzen 5 / 16GB / 512GB SSD",
		price: "9499000.00",
	},
	{
		product_name: "LG UHD TV 43 Inch",
		product_code: "LG-UHD-43-2025",
		name: "43 Inch - Black",
		price: "5499000.00",
	},
	{
		product_name: "Sony WH-CH520",
		product_code: "SNY-WHCH520-BLK",
		name: "Black",
		price: "699000.00",
	},
	{
		product_name: "Xiaomi Redmi Note 14",
		product_code: "XMI-RN14-8-256-BLK",
		name: "8GB / 256GB - Black",
		price: "3299000.00",
	},
];

const productNames = [
	...new Set(productItems.map((item) => item.product_name)),
];
const productCodes = productItems.map((item) => item.product_code);

module.exports = {
	async up(queryInterface, { QueryTypes }) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			const products = await queryInterface.sequelize.query(
				"SELECT id, name FROM products WHERE name IN (:names)",
				{
					replacements: { names: productNames },
					type: QueryTypes.SELECT,
					transaction,
				},
			);

			const productId = Object.fromEntries(
				products.map((product) => [product.name, product.id]),
			);

			const missingProducts = productNames.filter((name) => !productId[name]);

			if (missingProducts.length > 0) {
				throw new Error(
					`Cannot seed product items: missing product(s): ${missingProducts.join(", ")}.`,
				);
			}

			const now = new Date();

			await queryInterface.bulkInsert(
				"product_items",
				productItems.map((item) => ({
					product_id: productId[item.product_name],
					product_code: item.product_code,
					name: item.name,
					price: item.price,
					is_active: true,
					created_at: now,
					updated_at: now,
				})),
				{ transaction },
			);
		});
	},

	async down(queryInterface, { Op }) {
		await queryInterface.bulkDelete("product_items", {
			product_code: { [Op.in]: productCodes },
		});
	},
};
