module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(
			"CREATE EXTENSION IF NOT EXISTS pgcrypto;",
		);
		await queryInterface.createTable("roles", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			name: { type: Sequelize.STRING(50), allowNull: false, unique: true },
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
		await queryInterface.dropTable("roles");
	},
};
