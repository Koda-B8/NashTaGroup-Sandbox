/* eslint-disable no-undef, typescript/no-require-imports, unicorn/prefer-module */

const { Model } = require("sequelize");

const defineRoles = (sequelize, DataTypes) => {
	class Roles extends Model {
		static associate(models) {
			Roles.hasMany(models.Users, {
				foreignKey: "role_id",
				as: "users",
			});
		}
	}

	Roles.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING(50),
				allowNull: false,
				unique: true,
			},
		},
		{
			sequelize,
			modelName: "Roles",
			tableName: "roles",
			underscored: true,
			paranoid: true,
		},
	);

	return Roles;
};

module.exports = defineRoles;
