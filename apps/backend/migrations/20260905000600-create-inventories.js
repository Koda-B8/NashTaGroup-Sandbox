/* eslint-disable no-undef, unicorn/prefer-module */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("inventories", {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
			},
			product_item_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				unique: true,
				references: { model: "product_items", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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
	},

	async down(queryInterface) {
		await queryInterface.dropTable("inventories");
	},
};
