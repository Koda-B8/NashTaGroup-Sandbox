// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const definePayments = (sequelize, DataTypes) => {
	class Payments extends Model {
		static associate(models) {
			Payments.belongsTo(models.Transactions, {
				foreignKey: "transactionId",
				as: "transaction",
			});

			Payments.belongsTo(models.PaymentMethods, {
				foreignKey: "paymentMethodId",
				as: "paymentMethod",
			});
		}
	}

	Payments.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			transactionId: {
				type: DataTypes.UUID,
				allowNull: false,
				unique: true,
				field: "transaction_id",
			},
			paymentMethodId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "payment_method_id",
			},
			paymentReference: {
				type: DataTypes.STRING(100),
				allowNull: true,
				unique: true,
				field: "payment_reference",
			},
			status: {
				type: DataTypes.STRING(30),
				allowNull: false,
				defaultValue: "pending",
			},
			amount: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
			},
			paidAmount: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
				defaultValue: 0,
				field: "paid_amount",
			},
			changeAmount: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
				defaultValue: 0,
				field: "change_amount",
			},
			expiredAt: {
				type: DataTypes.DATE,
				allowNull: true,
				field: "expired_at",
			},
			paidAt: {
				type: DataTypes.DATE,
				allowNull: true,
				field: "paid_at",
			},
		},
		{
			sequelize,
			modelName: "Payments",
			tableName: "payments",
			underscored: true,
		},
	);

	return Payments;
};

module.exports = definePayments;
