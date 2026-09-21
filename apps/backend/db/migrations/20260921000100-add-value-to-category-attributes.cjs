module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn("category_attributes", "value", {
			type: Sequelize.STRING(255),
			allowNull: true,
			after: "name",
		});
	},

	async down(queryInterface) {
		await queryInterface.removeColumn("category_attributes", "value");
	},
};
