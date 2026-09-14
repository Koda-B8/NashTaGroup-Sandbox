// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineProductImages = (sequelize, DataTypes) => {
	class ProductImages extends Model {
		static associate(models) {
			ProductImages.belongsTo(models.Products, {
				foreignKey: "productId",
				as: "product",
			});

			ProductImages.belongsTo(models.ProductItems, {
				foreignKey: "productItemId",
				as: "productItem",
			});
		}
	}

	ProductImages.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			productId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "product_id",
			},
			productItemId: {
				type: DataTypes.UUID,
				allowNull: true,
				field: "product_item_id",
			},
			imageUrl: {
				type: DataTypes.STRING(2048),
				allowNull: false,
				field: "image_url",
			},
			alt: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			isPrimary: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
				field: "is_primary",
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
			modelName: "ProductImages",
			tableName: "product_images",
			underscored: true,
		},
	);

	return ProductImages;
};

module.exports = defineProductImages;
