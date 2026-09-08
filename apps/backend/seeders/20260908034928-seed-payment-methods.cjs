const paymentMethods = [
	{
		code: "CASH",
		name: "Cash",
		type: "cash",
		admin_fee: "0.00",
	},
	{
		code: "QRIS",
		name: "QRIS",
		type: "qris",
		admin_fee: "0.00",
	},
	{
		code: "DEBIT",
		name: "Debit Card",
		type: "debit",
		admin_fee: "0.00",
	},
	{
		code: "TRANSFER",
		name: "Bank Transfer",
		type: "transfer",
		admin_fee: "0.00",
	},
];

const paymentMethodCodes = paymentMethods.map((method) => method.code);

module.exports = {
	async up(queryInterface) {
		const now = new Date();

		await queryInterface.bulkInsert(
			"payment_methods",
			paymentMethods.map((method) => ({
				...method,
				is_active: true,
				created_at: now,
				updated_at: now,
			})),
		);
	},

	async down(queryInterface, { Op }) {
		await queryInterface.bulkDelete("payment_methods", {
			code: { [Op.in]: paymentMethodCodes },
		});
	},
};
