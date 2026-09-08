const inventoryItems = [
	{ product_code: "SAM-A55-8-128-BLU", stock: 12 },
	{ product_code: "SAM-A55-8-256-NVY", stock: 8 },
	{ product_code: "APL-IP15-128-BLK", stock: 7 },
	{ product_code: "ASU-VB14-I5-512", stock: 6 },
	{ product_code: "LEN-IPS3-R5-512", stock: 5 },
	{ product_code: "LG-UHD-43-2025", stock: 4 },
	{ product_code: "SNY-WHCH520-BLK", stock: 10 },
	{ product_code: "XMI-RN14-8-256-BLK", stock: 14 },
];

const productCodes = inventoryItems.map((item) => item.product_code);

module.exports = {
	async up(queryInterface, { QueryTypes }) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			const productItems = await queryInterface.sequelize.query(
				"SELECT id, product_code FROM product_items WHERE product_code IN (:codes)",
				{
					replacements: { codes: productCodes },
					type: QueryTypes.SELECT,
					transaction,
				},
			);

			const productItemId = Object.fromEntries(
				productItems.map((item) => [item.product_code, item.id]),
			);

			const missingProductItems = productCodes.filter(
				(code) => !productItemId[code],
			);

			if (missingProductItems.length > 0) {
				throw new Error(
					`Cannot seed inventories: missing product item(s): ${missingProductItems.join(", ")}.`,
				);
			}

			const now = new Date();

			await queryInterface.bulkInsert(
				"inventories",
				inventoryItems.map((item) => ({
					product_item_id: productItemId[item.product_code],
					stock: item.stock,
					created_at: now,
					updated_at: now,
				})),
				{ transaction },
			);
		});
	},

	async down(queryInterface, { Op, QueryTypes }) {
		const productItems = await queryInterface.sequelize.query(
			"SELECT id FROM product_items WHERE product_code IN (:codes)",
			{
				replacements: { codes: productCodes },
				type: QueryTypes.SELECT,
			},
		);

		await queryInterface.bulkDelete("inventories", {
			product_item_id: { [Op.in]: productItems.map((item) => item.id) },
		});
	},
};
