// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const definePaymentMethods = (sequelize, DataTypes) => {
	class PaymentMethods extends Model {}

	PaymentMethods.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			code: {
				type: DataTypes.STRING(30),
				allowNull: false,
				unique: true,
			},
			name: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
			type: {
				type: DataTypes.STRING(30),
				allowNull: false,
			},
			adminFee: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
				defaultValue: 0,
				field: "admin_fee",
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
				field: "is_active",
			},
		},
		{
			sequelize,
			modelName: "PaymentMethods",
			tableName: "payment_methods",
			underscored: true,
		},
	);

	return PaymentMethods;
};

module.exports = definePaymentMethods;
