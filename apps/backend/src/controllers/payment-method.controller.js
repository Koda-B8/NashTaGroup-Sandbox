import { constants } from "node:http2";

import db from "../models/index.cjs";

const { PaymentMethods } = db;

const parseBoolean = (value) => {
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;
};

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

		if (request.query.is_active !== undefined && isActive === undefined) {
			const error = new Error("is_active must be true or false");
			// @ts-ignore
			error.statusCode = constants.HTTP_STATUS_BAD_REQUEST;
			throw error;
		}

		const paymentMethods = await PaymentMethods.findAll({
			where: isActive === undefined ? {} : { isActive },
			order: [["name", "ASC"]],
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
