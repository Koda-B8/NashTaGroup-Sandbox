/* eslint-disable no-undef, unicorn/prefer-module */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("products", {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
			},
			category_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: { model: "categories", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			name: { type: Sequelize.STRING(150), allowNull: false },
			description: { type: Sequelize.TEXT, allowNull: true },
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
		await queryInterface.addIndex("products", ["category_id"], {
			name: "products_category_id_idx",
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("products");
	},
};
