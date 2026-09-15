module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("product_image_cleanups", {
			public_id: {
				type: Sequelize.STRING(512),
				allowNull: false,
				primaryKey: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn("NOW"),
			},
		});
	},
	async down(queryInterface) {
		await queryInterface.dropTable("product_image_cleanups");
	},
};
