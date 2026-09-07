const usernames = ["admin", "cashier"];

module.exports = {
	async up(queryInterface, { QueryTypes }) {
		const argon2 = await import("argon2");
		await queryInterface.sequelize.transaction(async (transaction) => {
			const roles = await queryInterface.sequelize.query(
				"SELECT id, name FROM roles WHERE name IN (:names)",
				{
					replacements: { names: ["admin", "cashier"] },
					type: QueryTypes.SELECT,
					transaction,
				},
			);
			const roleId = Object.fromEntries(
				roles.map((role) => [role.name, role.id]),
			);
			const now = new Date();

			await queryInterface.bulkInsert(
				"users",
				[
					{
						role_id: roleId.admin,
						fullname: "System Administrator",
						username: "admin",
						password_hash: await argon2.hash("Admin123!", {
							type: argon2.argon2id,
						}),
						is_active: true,
						created_at: now,
						updated_at: now,
					},
					{
						role_id: roleId.cashier,
						fullname: "Demo Cashier",
						username: "cashier",
						password_hash: await argon2.hash("Cashier123!", {
							type: argon2.argon2id,
						}),
						is_active: true,
						created_at: now,
						updated_at: now,
					},
				],
				{ transaction },
			);
		});
	},

	async down(queryInterface, { Op }) {
		await queryInterface.bulkDelete("users", {
			username: { [Op.in]: usernames },
		});
	},
};
