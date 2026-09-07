const roleNames = ["admin", "cashier"];

module.exports = {
	async up(queryInterface) {
		const now = new Date();
		await queryInterface.bulkInsert(
			"roles",
			roleNames.map((name) => ({ name, created_at: now, updated_at: now })),
		);
	},

	async down(queryInterface, { Op }) {
		await queryInterface.bulkDelete("roles", { name: { [Op.in]: roleNames } });
	},
};
