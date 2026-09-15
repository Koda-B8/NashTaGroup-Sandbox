module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addIndex("product_images", ["product_id"], {
			name: "product_images_one_primary_per_product",
			unique: true,
			where: {
				is_primary: true,
				product_item_id: null,
			},
		});

		await queryInterface.addIndex("product_images", ["product_item_id"], {
			name: "product_images_one_primary_per_item",
			unique: true,
			where: {
				is_primary: true,
				product_item_id: { [Sequelize.Op.ne]: null },
			},
		});
	},

	async down(queryInterface) {
		await queryInterface.removeIndex(
			"product_images",
			"product_images_one_primary_per_item",
		);
		await queryInterface.removeIndex(
			"product_images",
			"product_images_one_primary_per_product",
		);
	},
};
