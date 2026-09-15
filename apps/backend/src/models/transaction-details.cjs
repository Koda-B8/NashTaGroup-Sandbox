// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineTransactionDetails = (sequelize, DataTypes) => {
	class TransactionDetails extends Model {
		static associate(models) {
			TransactionDetails.belongsTo(models.Transactions, {
				foreignKey: "transactionId",
				as: "transaction",
			});

			TransactionDetails.belongsTo(models.ProductItems, {
				foreignKey: "productItemId",
				as: "productItem",
			});
		}
	}

	TransactionDetails.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			transactionId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "transaction_id",
			},
			productItemId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "product_item_id",
			},
			productName: {
				type: DataTypes.STRING(150),
				allowNull: false,
				field: "product_name",
			},
			productCode: {
				type: DataTypes.STRING(50),
				allowNull: false,
				field: "product_code",
			},
			unitPrice: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
				field: "unit_price",
			},
			qty: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			subtotal: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: "TransactionDetails",
			tableName: "transaction_details",
			underscored: true,
		},
	);

	return TransactionDetails;
};

module.exports = defineTransactionDetails;
