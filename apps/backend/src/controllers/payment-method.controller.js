import { constants } from "node:http2";

import { parseSorting } from "../lib/sorting.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean } from "../utils/query.js";

const { PaymentMethods } = db;
const PAYMENT_METHOD_SORTS = new Map([
	["name_asc", [["name", "ASC"]]],
	["name_desc", [["name", "DESC"]]],
	["admin_fee_asc", [["adminFee", "ASC"]]],
	["admin_fee_desc", [["adminFee", "DESC"]]],
]);

const toPaymentMethodResponse = (paymentMethod) => {
	const value =
		typeof paymentMethod?.toJSON === "function"
			? paymentMethod.toJSON()
			: paymentMethod;
	const { adminFee, isActive, ...data } = value;

	return {
		...data,
		admin_fee: adminFee,
		is_active: isActive,
	};
};

export async function getPaymentMethods(request, response, next) {
	try {
		const isActive = parseBoolean(request.query.is_active);
		const { order } = parseSorting(request.query, {
			defaultSort: "name_asc",
			options: PAYMENT_METHOD_SORTS,
			message:
				"sort must be name_asc, name_desc, admin_fee_asc, or admin_fee_desc",
		});

		if (request.query.is_active !== undefined && isActive === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"is_active must be true or false",
			);
		}

		const paymentMethods = await PaymentMethods.findAll({
			where: isActive === undefined ? {} : { isActive },
			order,
		});

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Payment methods retrieved successfully",
			data: paymentMethods.map((method) => toPaymentMethodResponse(method)),
		});
	} catch (error) {
		return next(error);
	}
}
