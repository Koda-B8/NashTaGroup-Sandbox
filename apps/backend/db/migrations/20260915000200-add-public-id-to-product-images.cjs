module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn("product_images", "public_id", {
			type: Sequelize.STRING(512),
			allowNull: true,
			unique: true,
		});
	},

	async down(queryInterface) {
		await queryInterface.removeColumn("product_images", "public_id");
	},
};
