// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineInventories = (sequelize, DataTypes) => {
	class Inventories extends Model {
		static associate(models) {
			Inventories.belongsTo(models.ProductItems, {
				foreignKey: "productItemId",
				as: "productItem",
			});
		}
	}

	Inventories.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			productItemId: {
				type: DataTypes.UUID,
				allowNull: false,
				unique: true,
				field: "product_item_id",
			},
			stock: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
		},
		{
			sequelize,
			modelName: "Inventories",
			tableName: "inventories",
			underscored: true,
		},
	);

	return Inventories;
};

module.exports = defineInventories;
