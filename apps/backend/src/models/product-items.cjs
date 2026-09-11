const { Model } = require("sequelize");

const defineProductItems = (sequelize, DataTypes) => {
	class ProductItems extends Model {
		static associate(models) {
			ProductItems.belongsTo(models.Products, {
				foreignKey: "productId",
				as: "product",
			});
		}
	}

	ProductItems.init(
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
			productCode: {
				type: DataTypes.STRING(50),
				allowNull: false,
				unique: true,
				field: "product_code",
			},
			name: {
				type: DataTypes.STRING(150),
				allowNull: false,
			},
			price: {
				type: DataTypes.DECIMAL(15, 2),
				allowNull: false,
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
			modelName: "ProductItems",
			tableName: "product_items",
			underscored: true,
			paranoid: true,
		},
	);

	return ProductItems;
};

module.exports = defineProductItems;
