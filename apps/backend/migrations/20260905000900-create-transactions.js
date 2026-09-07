/* eslint-disable no-undef, unicorn/prefer-module */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("transactions", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			user_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "users", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			transaction_number: {
				type: Sequelize.STRING(50),
				allowNull: false,
				unique: true,
			},
			status: {
				type: Sequelize.STRING(30),
				allowNull: false,
				defaultValue: "pending",
			},
			subtotal: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
			discount_amount: {
				type: Sequelize.DECIMAL(15, 2),
				allowNull: false,
				defaultValue: 0,
			},
			tax_amount: {
				type: Sequelize.DECIMAL(15, 2),
				allowNull: false,
				defaultValue: 0,
			},
			total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
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
		await queryInterface.addIndex("transactions", ["created_at"], {
			name: "transactions_created_at_idx",
		});
		await queryInterface.addIndex("transactions", ["user_id", "created_at"], {
			name: "transactions_user_id_created_at_idx",
		});
		await queryInterface.addIndex("transactions", ["status"], {
			name: "transactions_status_idx",
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("transactions");
	},
};
