const { Model } = require("sequelize");

const defineBrands = (sequelize, DataTypes) => {
	class Brands extends Model {
		static associate(models) {
			Brands.hasMany(models.Products, {
				foreignKey: "brandId",
				as: "products",
			});
		}
	}

	Brands.init(
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
			modelName: "Brands",
			tableName: "brands",
			underscored: true,
			paranoid: true,
		},
	);

	return Brands;
};

module.exports = defineBrands;
