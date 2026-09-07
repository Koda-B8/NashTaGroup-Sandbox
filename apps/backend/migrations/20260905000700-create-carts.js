/* eslint-disable no-undef, unicorn/prefer-module */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("carts", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			user_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "users", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			status: {
				type: Sequelize.STRING(30),
				allowNull: false,
				defaultValue: "active",
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
		});
		await queryInterface.addIndex("carts", ["user_id", "status"], {
			name: "carts_user_id_status_idx",
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("carts");
	},
};
