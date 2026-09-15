// oxlint-disable typescript/no-require-imports
const { Model } = require("sequelize");

const defineCustomers = (sequelize, DataTypes) => {
	class Customers extends Model {
		static associate(models) {
			Customers.hasMany(models.Transactions, {
				foreignKey: "customerId",
				as: "transactions",
			});
		}
	}

	Customers.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING(150),
				allowNull: true,
			},
			phone: {
				type: DataTypes.STRING(30),
				allowNull: false,
				unique: true,
			},
		},
		{
			sequelize,
			modelName: "Customers",
			tableName: "customers",
			underscored: true,
			paranoid: true,
		},
	);

	return Customers;
};

module.exports = defineCustomers;
