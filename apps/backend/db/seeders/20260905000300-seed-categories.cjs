const categoryNames = [
	"Smartphone",
	"Laptop",
	"Komputer",
	"Tablet",
	"Televisi",
	"Audio",
	"Kamera",
	"Aksesori Elektronik",
];

module.exports = {
	async up(queryInterface) {
		const now = new Date();
		await queryInterface.bulkInsert(
			"categories",
			categoryNames.map((name) => ({
				name,
				is_active: true,
				created_at: now,
				updated_at: now,
			})),
		);
	},

	async down(queryInterface, { Op }) {
		await queryInterface.bulkDelete("categories", {
			name: { [Op.in]: categoryNames },
		});
	},
};
