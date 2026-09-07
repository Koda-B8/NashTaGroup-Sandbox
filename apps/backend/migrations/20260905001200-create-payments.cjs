module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("payments", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			transaction_id: {
				type: Sequelize.UUID,
				allowNull: false,
				unique: true,
				references: { model: "transactions", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			payment_method_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "payment_methods", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			payment_reference: {
				type: Sequelize.STRING(100),
				allowNull: true,
				unique: true,
			},
			status: {
				type: Sequelize.STRING(30),
				allowNull: false,
				defaultValue: "pending",
			},
			amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
			paid_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
			change_amount: {
				type: Sequelize.DECIMAL(15, 2),
				allowNull: false,
				defaultValue: 0,
			},
			expired_at: { type: Sequelize.DATE, allowNull: true },
			paid_at: { type: Sequelize.DATE, allowNull: true },
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
		});
		await queryInterface.addIndex(
			"payments",
			["payment_method_id", "paid_at"],
			{
				name: "payments_method_id_paid_at_idx",
			},
		);
		await queryInterface.addIndex("payments", ["status"], {
			name: "payments_status_idx",
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("payments");
	},
};
