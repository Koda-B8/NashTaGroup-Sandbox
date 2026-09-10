// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineCategories = (sequelize, DataTypes) => {
	class Categories extends Model {}

	Categories.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING(100),
				allowNull: false,
				unique: true,
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
			modelName: "Categories",
			tableName: "categories",
			underscored: true,
			paranoid: true,
		},
	);

	return Categories;
};

module.exports = defineCategories;
