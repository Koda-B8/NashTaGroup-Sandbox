/* eslint-disable no-undef, unicorn/prefer-module */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("transaction_details", {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
			},
			transaction_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: { model: "transactions", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			product_item_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: { model: "product_items", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			product_name: { type: Sequelize.STRING(150), allowNull: false },
			product_code: { type: Sequelize.STRING(50), allowNull: false },
			unit_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
			qty: { type: Sequelize.INTEGER, allowNull: false },
			subtotal: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
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
		await queryInterface.addIndex("transaction_details", ["transaction_id"], {
			name: "transaction_details_transaction_id_idx",
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("transaction_details");
	},
};
