const usernames = ["admin", "cashier"];
const roleNames = ["admin", "cashier"];

const requiredEnvironment = (name) => {
	const value = process.env[name];
	if (typeof value !== "string" || value.length === 0) {
		throw new Error(`${name} must be set before seeding users.`);
	}
	return value;
};

module.exports = {
	async up(queryInterface, { QueryTypes }) {
		const argon2 = await import("argon2");
		const adminPassword = requiredEnvironment("SEED_ADMIN_PASSWORD");
		const cashierPassword = requiredEnvironment("SEED_CASHIER_PASSWORD");
		await queryInterface.sequelize.transaction(async (transaction) => {
			const roles = await queryInterface.sequelize.query(
				"SELECT id, name FROM roles WHERE name IN (:names)",
				{
					replacements: { names: roleNames },
					type: QueryTypes.SELECT,
					transaction,
				},
			);
			const roleId = Object.fromEntries(
				roles.map((role) => [role.name, role.id]),
			);
			const missingRoles = roleNames.filter((name) => !roleId[name]);
			if (missingRoles.length > 0) {
				throw new Error(
					`Cannot seed users: missing role(s): ${missingRoles.join(", ")}.`,
				);
			}
			const now = new Date();

			await queryInterface.bulkInsert(
				"users",
				[
					{
						role_id: roleId.admin,
						fullname: "System Administrator",
						username: "admin",
						password_hash: await argon2.hash(adminPassword, {
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
						password_hash: await argon2.hash(cashierPassword, {
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
