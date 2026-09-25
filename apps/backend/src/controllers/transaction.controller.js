import { constants } from "node:http2";

import { Op } from "sequelize";

import { paginate } from "../lib/pagination.js";
import { parseSorting } from "../lib/sorting.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { isUuid } from "../utils/validation.js";

const {
	Customers,
	PaymentMethods,
	Payments,
	TransactionDetails,
	Transactions,
	Users,
} = db;

const TRANSACTION_SORTS = new Map([
	["created_at_desc", [["createdAt", "DESC"]]],
	["created_at_asc", [["createdAt", "ASC"]]],
	["total_amount_asc", [["totalAmount", "ASC"]]],
	["total_amount_desc", [["totalAmount", "DESC"]]],
]);
const TRANSACTION_STATUSES = new Set([
	"pending",
	"completed",
	"cancelled",
	"refunded",
]);
const MEMBER_TYPES = new Set(["member", "non_member"]);
const MONTH_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/;

const toPlain = (value) =>
	typeof value?.toJSON === "function" ? value.toJSON() : value;

const toMoneyCents = (value) => {
	const [whole, fraction = ""] = String(value).split(".");

	return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

const centsToMoney = (cents) => {
	const whole = cents / 100n;
	const fraction = (cents % 100n).toString().padStart(2, "0");

	return `${whole}.${fraction}`;
};

const formatMoney = (value) => centsToMoney(toMoneyCents(value));

const parseMonth = (value) => {
	if (!MONTH_PATTERN.test(value)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"month must use YYYY-MM format",
		);
	}

	const [year, month] = value.split("-").map(Number);
	const start = new Date(Date.UTC(year, month - 1, 1));
	const end = new Date(Date.UTC(year, month, 1));

	return { start, end };
};

const toCustomerResponse = (customer) =>
	customer
		? {
				id: customer.id,
				name: customer.name,
				phone: customer.phone,
			}
		: null;

const toTransactionDetailResponse = (record) => {
	const transaction = toPlain(record);
	const payment = transaction.payment;
	const customer = transaction.customer;

	return {
		id: transaction.id,
		transaction_number: transaction.transactionNumber,
		status: transaction.status,
		cashier: {
			id: transaction.user.id,
			fullname: transaction.user.fullname,
		},
		customer: toCustomerResponse(customer),
		items: (transaction.details ?? []).map((detail) => ({
			product_item_id: detail.productItemId,
			product_name: detail.productName,
			product_code: detail.productCode,
			unit_price: formatMoney(detail.unitPrice),
			qty: detail.qty,
			subtotal: formatMoney(detail.subtotal),
		})),
		summary: {
			subtotal: formatMoney(transaction.subtotal),
			discount_amount: formatMoney(transaction.discountAmount),
			tax_amount: formatMoney(transaction.taxAmount),
			total_amount: formatMoney(transaction.totalAmount),
		},
		payment: {
			method: payment.paymentMethod.name,
			payment_reference: payment.paymentReference ?? null,
			amount: formatMoney(payment.amount),
			paid_amount: formatMoney(payment.paidAmount),
			change_amount: formatMoney(payment.changeAmount),
			status: payment.status,
			paid_at: payment.paidAt,
		},
		created_at: transaction.createdAt,
	};
};

const toTransactionListResponse = (record) => {
	const transaction = toPlain(record);
	const payment = transaction.payment;

	return {
		id: transaction.id,
		transaction_number: transaction.transactionNumber,
		status: transaction.status,
		cashier: {
			id: transaction.user.id,
			fullname: transaction.user.fullname,
		},
		customer: toCustomerResponse(transaction.customer),
		total_amount: formatMoney(transaction.totalAmount),
		payment: {
			method: payment.paymentMethod.name,
			status: payment.status,
		},
		created_at: transaction.createdAt,
	};
};

const createPaymentInclude = (paymentMethodId) => ({
	model: Payments,
	as: "payment",
	attributes: [
		"paymentMethodId",
		"paymentReference",
		"status",
		"amount",
		"paidAmount",
		"changeAmount",
		"paidAt",
	],
	...(paymentMethodId ? { where: { paymentMethodId }, required: true } : {}),
	include: [
		{
			model: PaymentMethods,
			as: "paymentMethod",
			attributes: ["id", "name"],
		},
	],
});

const transactionListIncludes = (paymentMethodId) => [
	{
		model: Users,
		as: "user",
		attributes: ["id", "fullname"],
		required: true,
	},
	{
		model: Customers,
		as: "customer",
		attributes: ["id", "name", "phone"],
		required: false,
	},
	createPaymentInclude(paymentMethodId),
];

const transactionDetailIncludes = [
	{
		model: Users,
		as: "user",
		attributes: ["id", "fullname"],
		required: true,
	},
	{
		model: Customers,
		as: "customer",
		attributes: ["id", "name", "phone"],
		required: false,
	},
	{
		model: TransactionDetails,
		as: "details",
		attributes: [
			"productItemId",
			"productName",
			"productCode",
			"unitPrice",
			"qty",
			"subtotal",
		],
	},
	createPaymentInclude(),
];

export async function getTransactions(request, response, next) {
	try {
		const {
			month,
			customer_id: customerId,
			cashier_id: cashierId,
			payment_method_id: paymentMethodId,
			status,
			member_type: memberType,
		} = request.query;
		const { order } = parseSorting(request.query, {
			defaultSort: "created_at_desc",
			options: TRANSACTION_SORTS,
			message:
				"sort must be created_at_desc, created_at_asc, total_amount_asc, or total_amount_desc",
		});

		if (month !== undefined && typeof month !== "string") {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"month must use YYYY-MM format",
			);
		}

		if (customerId && !isUuid(customerId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"customer_id must be a valid UUID",
			);
		}

		if (cashierId && !isUuid(cashierId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"cashier_id must be a valid UUID",
			);
		}

		if (paymentMethodId && !isUuid(paymentMethodId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"payment_method_id must be a valid UUID",
			);
		}

		if (status && !TRANSACTION_STATUSES.has(status)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"status must be pending, completed, cancelled, or refunded",
			);
		}

		if (memberType && !MEMBER_TYPES.has(memberType)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"member_type must be member or non_member",
			);
		}

		const where = {};

		if (month) {
			const { start, end } = parseMonth(month);
			where.createdAt = { [Op.gte]: start, [Op.lt]: end };
		}

		if (customerId && memberType === "non_member") {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"customer_id cannot be used with member_type=non_member",
			);
		}

		if (customerId) where.customerId = customerId;
		if (cashierId) where.userId = cashierId;
		if (status) where.status = status;

		if (!customerId && memberType === "member") {
			where.customerId = { [Op.not]: null };
		}

		if (memberType === "non_member") {
			where.customerId = null;
		}

		const q = typeof request.query.q === "string" ? request.query.q.trim() : "";

		if (q) {
			where.transactionNumber = { [Op.iLike]: `%${q}%` };
		}

		const { rows, pagination } = await paginate(Transactions, request.query, {
			where,
			attributes: [
				"id",
				"transactionNumber",
				"status",
				"totalAmount",
				"createdAt",
			],
			include: transactionListIncludes(paymentMethodId),
			order,
			distinct: true,
		});

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Transactions retrieved successfully",
			data: rows.map((row) => toTransactionListResponse(row)),
			meta: {
				pagination,
			},
		});
	} catch (error) {
		return next(error);
	}
}

export async function getTransactionById(request, response, next) {
	try {
		const { id } = request.params;

		if (!isUuid(id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"id must be a valid UUID",
			);
		}

		const transaction = await Transactions.findByPk(id, {
			include: transactionDetailIncludes,
			order: [
				[{ model: TransactionDetails, as: "details" }, "createdAt", "ASC"],
			],
		});

		if (!transaction) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Transaction not found",
			);
		}

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Transaction retrieved successfully",
			data: toTransactionDetailResponse(transaction),
		});
	} catch (error) {
		return next(error);
	}
}
