const { Model } = require("sequelize");

const defineProducts = (sequelize, DataTypes) => {
	class Products extends Model {
		static associate(models) {
			Products.belongsTo(models.Categories, {
				foreignKey: "categoryId",
				as: "category",
			});

			Products.belongsTo(models.Brands, {
				foreignKey: "brandId",
				as: "brand",
			});

			Products.hasMany(models.ProductItems, {
				foreignKey: "productId",
				as: "items",
			});
		}
	}

	Products.init(
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
			brandId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "brand_id",
			},
			name: {
				type: DataTypes.STRING(150),
				allowNull: false,
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true,
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
			modelName: "Products",
			tableName: "products",
			underscored: true,
			paranoid: true,
		},
	);

	return Products;
};

module.exports = defineProducts;
