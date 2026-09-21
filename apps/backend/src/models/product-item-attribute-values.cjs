// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineProductItemAttributeValues = (sequelize, DataTypes) => {
	class ProductItemAttributeValues extends Model {
		static associate(models) {
			ProductItemAttributeValues.belongsTo(models.ProductItems, {
				foreignKey: "productItemId",
				as: "productItem",
			});
			ProductItemAttributeValues.belongsTo(models.CategoryAttributes, {
				foreignKey: "categoryAttributeId",
				as: "attribute",
			});
			ProductItemAttributeValues.belongsTo(models.CategoryAttributeOptions, {
				foreignKey: "categoryAttributeOptionId",
				as: "option",
			});
		}
	}

	ProductItemAttributeValues.init(
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
			categoryAttributeId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "category_attribute_id",
			},
			categoryAttributeOptionId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "category_attribute_option_id",
			},
			value: { type: DataTypes.TEXT, allowNull: false },
		},
		{
			sequelize,
			modelName: "ProductItemAttributeValues",
			tableName: "product_item_attribute_values",
			underscored: true,
		},
	);

	return ProductItemAttributeValues;
};

module.exports = defineProductItemAttributeValues;
