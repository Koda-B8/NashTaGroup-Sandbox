// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineTransactions = (sequelize, DataTypes) => {
	class Transactions extends Model {
		static associate(models) {
			Transactions.belongsTo(models.Users, {
				foreignKey: "userId",
				as: "user",
			});

			Transactions.belongsTo(models.Customers, {
				foreignKey: "customerId",
				as: "customer",
			});

			Transactions.hasMany(models.TransactionDetails, {
				foreignKey: "transactionId",
				as: "details",
			});

			Transactions.hasOne(models.Payments, {
				foreignKey: "transactionId",
				as: "payment",
			});

			Transactions.hasMany(models.InventoryMovements, {
				foreignKey: "transactionId",
				as: "inventoryMovements",
			});
		}
	}

	Transactions.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "user_id",
			},
			customerId: {
				type: DataTypes.UUID,
				allowNull: true,
				field: "customer_id",
			},
			idempotencyKey: {
				type: DataTypes.UUID,
				allowNull: false,
				unique: true,
				field: "idempotency_key",
			},
			transactionNumber: {
				type: DataTypes.STRING(50),
				allowNull: false,
				unique: true,
				field: "transaction_number",
			},
			status: {
				type: DataTypes.STRING(30),
				allowNull: false,
				defaultValue: "pending",
			},
			subtotal: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
			},
			discountAmount: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
				defaultValue: 0,
				field: "discount_amount",
			},
			taxAmount: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
				defaultValue: 0,
				field: "tax_amount",
			},
			totalAmount: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
				field: "total_amount",
			},
		},
		{
			sequelize,
			modelName: "Transactions",
			tableName: "transactions",
			underscored: true,
		},
	);

	return Transactions;
};

module.exports = defineTransactions;
