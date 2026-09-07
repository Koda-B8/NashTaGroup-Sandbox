module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("inventory_movements", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			product_item_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "product_items", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			transaction_id: {
				type: Sequelize.UUID,
				allowNull: true,
				references: { model: "transactions", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "SET NULL",
			},
			user_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "users", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			type: { type: Sequelize.STRING(30), allowNull: false },
			quantity: { type: Sequelize.INTEGER, allowNull: false },
			stock_before: { type: Sequelize.INTEGER, allowNull: false },
			stock_after: { type: Sequelize.INTEGER, allowNull: false },
			note: { type: Sequelize.TEXT, allowNull: true },
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn("NOW"),
			},
		});
		await queryInterface.addIndex(
			"inventory_movements",
			["product_item_id", "created_at"],
			{
				name: "inventory_movements_item_created_at_idx",
			},
		);
		await queryInterface.addIndex("inventory_movements", ["transaction_id"], {
			name: "inventory_movements_transaction_id_idx",
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("inventory_movements");
	},
};
