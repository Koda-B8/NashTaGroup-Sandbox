const argon2 = require("argon2");
const { Model } = require("sequelize");

const defineUsers = (sequelize, DataTypes) => {
	class Users extends Model {
		static associate(models) {
			Users.belongsTo(models.Roles, {
				foreignKey: "role_id",
				as: "role",
			});
		}

		static hashPassword(password) {
			return argon2.hash(password, { type: argon2.argon2id });
		}
	}

	Users.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			role_id: {
				type: DataTypes.UUID,
				allowNull: false,
			},
			fullname: {
				type: DataTypes.STRING(150),
				allowNull: false,
			},
			username: {
				type: DataTypes.STRING(100),
				allowNull: false,
				unique: true,
			},
			password: {
				type: DataTypes.STRING(255),
				allowNull: false,
				field: "password_hash",
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
			modelName: "Users",
			tableName: "users",
			underscored: true,
			paranoid: true,
			defaultScope: {
				attributes: { exclude: ["password"] },
			},
			scopes: {
				withPassword: {
					attributes: { include: ["password"] },
				},
			},
			hooks: {
				async beforeSave(user) {
					const userWithPassword = /** @type {any} */ (user);

					if (userWithPassword.changed("password")) {
						userWithPassword.password = await Users.hashPassword(
							userWithPassword.password,
						);
					}
				},
			},
		},
	);

	return Users;
};

module.exports = defineUsers;
