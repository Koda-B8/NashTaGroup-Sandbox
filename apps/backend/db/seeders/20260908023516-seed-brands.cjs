const brandNames = [
	"ASUS",
	"Apple",
	"Samsung",
	"LG",
	"Sony",
	"Xiaomi",
	"Lenovo",
];

module.exports = {
	async up(queryInterface) {
		const now = new Date();

		await queryInterface.bulkInsert(
			"brands",
			brandNames.map((name) => ({
				name,
				is_active: true,
				created_at: now,
				updated_at: now,
			})),
		);
	},

	async down(queryInterface, { Op }) {
		await queryInterface.bulkDelete("brands", {
			name: {
				[Op.in]: brandNames,
			},
		});
	},
};
