// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineCategoryAttributes = (sequelize, DataTypes) => {
	class CategoryAttributes extends Model {
		static associate(models) {
			CategoryAttributes.belongsTo(models.Categories, {
				foreignKey: "categoryId",
				as: "category",
			});
			CategoryAttributes.hasMany(models.ProductItemAttributeValues, {
				foreignKey: "categoryAttributeId",
				as: "values",
			});
			CategoryAttributes.hasMany(models.CategoryAttributeOptions, {
				foreignKey: "categoryAttributeId",
				as: "options",
			});
		}
	}

	CategoryAttributes.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			categoryId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "category_id",
			},
			name: { type: DataTypes.STRING(100), allowNull: false },
			value: { type: DataTypes.STRING(255), allowNull: true },
			isRequired: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
				field: "is_required",
			},
			isVariant: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
				field: "is_variant",
			},
			sortOrder: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
				field: "sort_order",
			},
		},
		{
			sequelize,
			modelName: "CategoryAttributes",
			tableName: "category_attributes",
			underscored: true,
		},
	);

	return CategoryAttributes;
};

module.exports = defineCategoryAttributes;
