/* eslint-disable no-undef, unicorn/prefer-module */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("cart_items", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			cart_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "carts", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			product_item_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "product_items", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			qty: { type: Sequelize.INTEGER, allowNull: false },
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn("NOW"),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn("NOW"),
			},
		});
		await queryInterface.addIndex(
			"cart_items",
			["cart_id", "product_item_id"],
			{
				name: "cart_items_cart_product_item_unique",
				unique: true,
			},
		);
	},

	async down(queryInterface) {
		await queryInterface.dropTable("cart_items");
	},
};
