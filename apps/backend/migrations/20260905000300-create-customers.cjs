module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("customers", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			name: { type: Sequelize.STRING(150), allowNull: true },
			phone: {
				type: Sequelize.STRING(30),
				allowNull: false,
				unique: true,
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
		await queryInterface.dropTable("customers");
	},
};
