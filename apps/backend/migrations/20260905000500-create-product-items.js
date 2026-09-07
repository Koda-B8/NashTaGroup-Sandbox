/* eslint-disable no-undef, unicorn/prefer-module */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("product_items", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			product_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "products", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			product_code: {
				type: Sequelize.STRING(50),
				allowNull: false,
				unique: true,
			},
			name: { type: Sequelize.STRING(150), allowNull: false },
			price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
			is_active: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
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
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await queryInterface.addIndex("product_items", ["product_id"], {
			name: "product_items_product_id_idx",
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("product_items");
	},
};
