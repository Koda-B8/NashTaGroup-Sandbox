const { Model } = require("sequelize");

module.exports = function defineProductImageCleanups(sequelize, DataTypes) {
	class ProductImageCleanups extends Model {}
	ProductImageCleanups.init(
		{
			publicId: {
				type: DataTypes.STRING(512),
				allowNull: false,
				primaryKey: true,
				field: "public_id",
			},
		},
		{
			sequelize,
			modelName: "ProductImageCleanups",
			tableName: "product_image_cleanups",
			underscored: true,
			updatedAt: false,
		},
	);
	return ProductImageCleanups;
};
