/* eslint-disable no-undef, unicorn/prefer-module */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("users", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			role_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "roles", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			fullname: { type: Sequelize.STRING(150), allowNull: false },
			username: { type: Sequelize.STRING(100), allowNull: false, unique: true },
			password_hash: { type: Sequelize.STRING(255), allowNull: false },
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
	},

	async down(queryInterface) {
		await queryInterface.dropTable("users");
	},
};
