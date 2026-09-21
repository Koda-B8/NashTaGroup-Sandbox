// @ts-nocheck
import { DataTypes } from "sequelize";

const UUID_TYPE = new DataTypes.UUID();

export const isUuid = (value) => {
	try {
		return UUID_TYPE.validate(value);
	} catch {
		return false;
	}
};

export const normalizeText = (value) => {
	if (typeof value !== "string") return "";

	return value.trim().replaceAll(/\s+/g, " ");
};
