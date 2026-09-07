import argon2 from "argon2";
import { DataTypes, Sequelize } from "sequelize";
import { afterAll, describe, expect, it } from "vitest";

import defineUsers from "../../../models/users.cjs";

const sequelize = new Sequelize("postgres://postgres:postgres@localhost/test", {
	logging: false,
});
const Users = defineUsers(sequelize, DataTypes);
const UsersModel = /** @type {any} */ (Users);

describe("Users model", () => {
	afterAll(async () => {
		await sequelize.close();
	});

	it("hashes a plain-text password before saving", async () => {
		const user = Users.build({
			role_id: "587f8735-b747-46ec-91e1-befd2466013f",
			fullname: "Test User",
			username: "test-user",
			password: "Secret123!",
		});

		await UsersModel.runHooks("beforeSave", user, {});

		const password = /** @type {any} */ (user).password;
		expect(password).not.toBe("Secret123!");
		await expect(argon2.verify(password, "Secret123!")).resolves.toBe(true);
	});

	it("does not hash the password again when it has not changed", async () => {
		const passwordHash = await Users.hashPassword("Secret123!");
		const user = Users.build({ password: passwordHash });
		/** @type {any} */ (user).changed("password", false);

		await UsersModel.runHooks("beforeSave", user, {});

		expect(/** @type {any} */ (user).password).toBe(passwordHash);
	});
});
