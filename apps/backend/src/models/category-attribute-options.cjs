// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineCategoryAttributeOptions = (sequelize, DataTypes) => {
	class CategoryAttributeOptions extends Model {
		static associate(models) {
			CategoryAttributeOptions.belongsTo(models.CategoryAttributes, {
				foreignKey: "categoryAttributeId",
				as: "attribute",
			});
			CategoryAttributeOptions.hasMany(models.ProductItemAttributeValues, {
				foreignKey: "categoryAttributeOptionId",
				as: "values",
			});
		}
	}

	CategoryAttributeOptions.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			categoryAttributeId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "category_attribute_id",
			},
			name: { type: DataTypes.STRING(100), allowNull: false },
			hex: { type: DataTypes.STRING(7), allowNull: true },
			sortOrder: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
				field: "sort_order",
			},
		},
		{
			sequelize,
			modelName: "CategoryAttributeOptions",
			tableName: "category_attribute_options",
			underscored: true,
		},
	);

	return CategoryAttributeOptions;
};

module.exports = defineCategoryAttributeOptions;
