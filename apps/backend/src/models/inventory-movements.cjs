// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineInventoryMovements = (sequelize, DataTypes) => {
	class InventoryMovements extends Model {
		static associate(models) {
			InventoryMovements.belongsTo(models.ProductItems, {
				foreignKey: "productItemId",
				as: "productItem",
			});

			InventoryMovements.belongsTo(models.Users, {
				foreignKey: "userId",
				as: "user",
			});

			InventoryMovements.belongsTo(models.Transactions, {
				foreignKey: "transactionId",
				as: "transaction",
			});
		}
	}

	InventoryMovements.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			productItemId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "product_item_id",
			},
			transactionId: {
				type: DataTypes.UUID,
				allowNull: true,
				field: "transaction_id",
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "user_id",
			},
			type: {
				type: DataTypes.STRING(30),
				allowNull: false,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			stockBefore: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "stock_before",
			},
			stockAfter: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "stock_after",
			},
			note: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: "InventoryMovements",
			tableName: "inventory_movements",
			underscored: true,
			createdAt: "created_at",
			updatedAt: false,
		},
	);

	return InventoryMovements;
};

module.exports = defineInventoryMovements;
