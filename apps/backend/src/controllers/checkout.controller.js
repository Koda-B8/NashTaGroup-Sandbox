import { randomUUID } from "node:crypto";
import { constants } from "node:http2";

import { UniqueConstraintError } from "sequelize";

import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { isUuid, normalizeText } from "../utils/validation.js";

const {
	Customers,
	Inventories,
	InventoryMovements,
	PaymentMethods,
	Payments,
	ProductItems,
	Products,
	TransactionDetails,
	Transactions,
	Users,
} = db;

const MONEY_PATTERN = /^(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/;
const PHONE_PATTERN = /^\+?\d{8,30}$/;

const toPlain = (value) =>
	typeof value?.toJSON === "function" ? value.toJSON() : value;

const toMoneyCents = (value, field) => {
	if (typeof value !== "string" || !MONEY_PATTERN.test(value)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			`${field} must be a non-negative decimal string with up to 2 decimal places`,
		);
	}

	const [whole, fraction = ""] = value.split(".");

	return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

const storedMoneyToCents = (value) => {
	const stringValue = String(value);
	const [whole, fraction = ""] = stringValue.split(".");

	return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

const centsToMoney = (cents) => {
	const whole = cents / 100n;
	const fraction = (cents % 100n).toString().padStart(2, "0");

	return `${whole}.${fraction}`;
};

const normalizePhone = (value) => {
	if (typeof value !== "string") return "";

	return value.trim().replaceAll(/[()\s-]/g, "");
};

const generateTransactionNumber = () => {
	const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
	const suffix = randomUUID().slice(0, 8).toUpperCase();

	return `TRX-${date}-${suffix}`;
};

const createErrorWithDetails = (statusCode, message, errors) =>
	createHttpError(statusCode, message, errors);

const normalizeItems = (items) => {
	if (!Array.isArray(items) || items.length === 0) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"items must contain at least one item",
		);
	}

	const groupedItems = new Map();

	items.forEach((item, index) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`items[${index}] must be an object`,
			);
		}

		const productItemId = item.product_item_id;
		const qty = item.qty;

		if (!isUuid(productItemId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`items[${index}].product_item_id must be a valid UUID`,
			);
		}

		if (!Number.isSafeInteger(qty) || qty < 1) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`items[${index}].qty must be an integer of at least 1`,
			);
		}

		const currentQty = groupedItems.get(productItemId) ?? 0;
		const totalQty = currentQty + qty;

		if (!Number.isSafeInteger(totalQty)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`items[${index}].qty is too large`,
			);
		}

		groupedItems.set(productItemId, totalQty);
	});

	return [...groupedItems.entries()]
		.map(([productItemId, qty]) => ({ productItemId, qty }))
		.sort((first, second) =>
			first.productItemId.localeCompare(second.productItemId),
		);
};

const normalizeCustomer = (customer) => {
	if (!customer || typeof customer !== "object" || Array.isArray(customer)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"customer must be an object",
		);
	}

	const phone = normalizePhone(customer.phone);

	if (!PHONE_PATTERN.test(phone)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"customer.phone must be a valid phone number",
		);
	}

	if (customer.name !== undefined && typeof customer.name !== "string") {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"customer.name must be a string",
		);
	}

	const name = normalizeText(customer.name);

	return { name: name || null, phone };
};

const normalizeCheckoutPayload = (request) => {
	const idempotencyKey = request.get("Idempotency-Key");

	if (!isUuid(idempotencyKey)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"Idempotency-Key must be a valid UUID",
		);
	}

	const body = request.body;

	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"Request body must be an object",
		);
	}

	const hasCustomerId = Object.hasOwn(body, "customer_id");
	const hasCustomerPhone = Object.hasOwn(body, "customer_phone");
	const hasCustomer = Object.hasOwn(body, "customer");

	if (hasCustomerId) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"customer_id is no longer supported; use customer_phone",
		);
	}

	if (hasCustomerPhone && hasCustomer) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"customer_phone and customer cannot be provided together",
		);
	}

	let customerPhone = null;
	let customer = null;

	if (hasCustomerPhone) {
		customerPhone = normalizePhone(body.customer_phone);

		if (!PHONE_PATTERN.test(customerPhone)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"customer_phone must be a valid phone number",
			);
		}
	}

	if (hasCustomer) {
		customer = normalizeCustomer(body.customer);
	}

	if (!isUuid(body.payment_method_id)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"payment_method_id must be a valid UUID",
		);
	}

	const paidAmount = toMoneyCents(body.paid_amount, "paid_amount");

	if (paidAmount <= 0n) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"paid_amount must be greater than zero",
		);
	}

	return {
		idempotencyKey,
		customerPhone,
		customer,
		items: normalizeItems(body.items),
		paidAmount,
		paymentMethodId: body.payment_method_id,
	};
};

const checkoutIncludes = [
	{
		model: Users,
		as: "user",
		attributes: ["id", "fullname"],
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
	{
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
		include: [
			{
				model: PaymentMethods,
				as: "paymentMethod",
				attributes: ["name"],
			},
		],
	},
];

const findCheckoutById = (id) =>
	Transactions.findByPk(id, {
		include: checkoutIncludes,
		order: [[{ model: TransactionDetails, as: "details" }, "createdAt", "ASC"]],
	});

const findCheckoutByIdempotencyKey = (idempotencyKey, options = {}) =>
	Transactions.findOne({
		where: { idempotencyKey },
		include: checkoutIncludes,
		order: [[{ model: TransactionDetails, as: "details" }, "createdAt", "ASC"]],
		...options,
	});

const hasSameItems = (existingDetails, requestedItems) => {
	const existingItems = existingDetails
		.map((detail) => ({
			productItemId: detail.productItemId,
			qty: detail.qty,
		}))
		.sort((first, second) =>
			first.productItemId.localeCompare(second.productItemId),
		);

	if (existingItems.length !== requestedItems.length) return false;

	return existingItems.every(
		(item, index) =>
			item.productItemId === requestedItems[index].productItemId &&
			item.qty === requestedItems[index].qty,
	);
};

const hasSamePayload = (existingTransaction, payload, userId) => {
	const transaction = toPlain(existingTransaction);
	const payment = transaction.payment;
	const customer = transaction.customer;

	if (
		transaction.userId !== userId ||
		transaction.payment?.paymentMethodId !== payload.paymentMethodId ||
		!payment ||
		storedMoneyToCents(payment.paidAmount) !== payload.paidAmount ||
		!hasSameItems(transaction.details ?? [], payload.items)
	) {
		return false;
	}

	if (payload.customerPhone) {
		return Boolean(customer) && customer.phone === payload.customerPhone;
	}

	if (payload.customer) {
		return (
			Boolean(customer) &&
			customer.phone === payload.customer.phone &&
			(customer.name ?? null) === payload.customer.name
		);
	}

	return transaction.customerId === null;
};

const toCheckoutResponse = (record) => {
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
		customer: customer
			? {
					id: customer.id,
					name: customer.name,
					phone: customer.phone,
				}
			: null,
		items: (transaction.details ?? []).map((detail) => ({
			product_item_id: detail.productItemId,
			product_name: detail.productName,
			product_code: detail.productCode,
			unit_price: centsToMoney(storedMoneyToCents(detail.unitPrice)),
			qty: detail.qty,
			subtotal: centsToMoney(storedMoneyToCents(detail.subtotal)),
		})),
		summary: {
			subtotal: centsToMoney(storedMoneyToCents(transaction.subtotal)),
			discount_amount: centsToMoney(
				storedMoneyToCents(transaction.discountAmount),
			),
			tax_amount: centsToMoney(storedMoneyToCents(transaction.taxAmount)),
			total_amount: centsToMoney(storedMoneyToCents(transaction.totalAmount)),
		},
		payment: {
			method: payment.paymentMethod.name,
			payment_reference: payment.paymentReference ?? null,
			amount: centsToMoney(storedMoneyToCents(payment.amount)),
			paid_amount: centsToMoney(storedMoneyToCents(payment.paidAmount)),
			change_amount: centsToMoney(storedMoneyToCents(payment.changeAmount)),
			status: payment.status,
			paid_at: payment.paidAt,
		},
		created_at: transaction.createdAt,
	};
};

const getCustomerForCheckout = async (payload, transaction) => {
	if (payload.customerPhone) {
		const customer = await Customers.findOne({
			where: { phone: payload.customerPhone },
			transaction,
			lock: transaction.LOCK.UPDATE,
		});

		if (!customer) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Customer not found",
			);
		}

		return customer;
	}

	if (!payload.customer) return null;

	const existingCustomer = await Customers.findOne({
		where: { phone: payload.customer.phone },
		transaction,
		lock: transaction.LOCK.UPDATE,
	});

	if (existingCustomer) {
		throw createHttpError(
			constants.HTTP_STATUS_CONFLICT,
			"Customer phone already exists",
		);
	}

	return Customers.create(payload.customer, { transaction });
};

export async function checkout(request, response, next) {
	let payload;

	try {
		payload = normalizeCheckoutPayload(request);

		const result = await db.sequelize.transaction(
			async (databaseTransaction) => {
				const existingTransaction = await findCheckoutByIdempotencyKey(
					payload.idempotencyKey,
					{ transaction: databaseTransaction },
				);

				if (existingTransaction) {
					if (!hasSamePayload(existingTransaction, payload, request.user.id)) {
						throw createHttpError(
							constants.HTTP_STATUS_CONFLICT,
							"Idempotency-Key has already been used with a different payload",
						);
					}

					return { id: existingTransaction.id, reused: true };
				}

				const transactionRecord = await Transactions.create(
					{
						userId: request.user.id,
						customerId: null,
						idempotencyKey: payload.idempotencyKey,
						transactionNumber: generateTransactionNumber(),
						status: "pending",
						subtotal: "0.00",
						discountAmount: "0.00",
						taxAmount: "0.00",
						totalAmount: "0.00",
					},
					{ transaction: databaseTransaction },
				);

				const customer = await getCustomerForCheckout(
					payload,
					databaseTransaction,
				);

				const paymentMethod = await PaymentMethods.findOne({
					where: {
						id: payload.paymentMethodId,
						isActive: true,
					},
					transaction: databaseTransaction,
					lock: databaseTransaction.LOCK.UPDATE,
				});

				if (!paymentMethod) {
					throw createHttpError(
						constants.HTTP_STATUS_NOT_FOUND,
						"Payment method not found",
					);
				}

				const lockedItems = [];
				const stockErrors = [];

				for (const requestedItem of payload.items) {
					const productItem = await ProductItems.findOne({
						where: {
							id: requestedItem.productItemId,
							isActive: true,
						},
						transaction: databaseTransaction,
						lock: databaseTransaction.LOCK.UPDATE,
					});

					if (!productItem) {
						throw createHttpError(
							constants.HTTP_STATUS_NOT_FOUND,
							"Product item not found",
						);
					}

					const product = await Products.findOne({
						where: {
							id: productItem.productId,
							isActive: true,
						},
						attributes: ["id", "name"],
						transaction: databaseTransaction,
					});

					if (!product) {
						throw createHttpError(
							constants.HTTP_STATUS_NOT_FOUND,
							"Product not found",
						);
					}

					const inventory = await Inventories.findOne({
						where: { productItemId: productItem.id },
						transaction: databaseTransaction,
						lock: databaseTransaction.LOCK.UPDATE,
					});

					if (!inventory) {
						throw createHttpError(
							constants.HTTP_STATUS_NOT_FOUND,
							"Inventory not found",
						);
					}

					const stockBefore = Number(inventory.stock);

					if (stockBefore < requestedItem.qty) {
						stockErrors.push({
							product_item_id: productItem.id,
							product_code: productItem.productCode,
							available_stock: stockBefore,
							requested_qty: requestedItem.qty,
						});
					}

					lockedItems.push({
						product,
						productItem,
						inventory,
						qty: requestedItem.qty,
						stockBefore,
					});
				}

				if (stockErrors.length > 0) {
					throw createErrorWithDetails(
						constants.HTTP_STATUS_CONFLICT,
						"Insufficient stock",
						stockErrors,
					);
				}

				const subtotalCents = lockedItems.reduce(
					(total, item) =>
						total +
						storedMoneyToCents(item.productItem.price) * BigInt(item.qty),
					0n,
				);
				const discountAmountCents = 0n;
				const taxAmountCents = 0n;
				const totalAmountCents =
					subtotalCents - discountAmountCents + taxAmountCents;

				if (
					paymentMethod.type === "cash" &&
					payload.paidAmount < totalAmountCents
				) {
					throw createHttpError(
						constants.HTTP_STATUS_BAD_REQUEST,
						"paid_amount must be greater than or equal to total_amount for cash payment",
					);
				}

				const changeAmountCents =
					paymentMethod.type === "cash"
						? payload.paidAmount - totalAmountCents
						: 0n;
				const paidAt = new Date();

				await transactionRecord.update(
					{
						customerId: customer?.id ?? null,
						status: "completed",
						subtotal: centsToMoney(subtotalCents),
						discountAmount: centsToMoney(discountAmountCents),
						taxAmount: centsToMoney(taxAmountCents),
						totalAmount: centsToMoney(totalAmountCents),
					},
					{ transaction: databaseTransaction },
				);

				await TransactionDetails.bulkCreate(
					lockedItems.map((item) => {
						const itemSubtotal =
							storedMoneyToCents(item.productItem.price) * BigInt(item.qty);

						return {
							transactionId: transactionRecord.id,
							productItemId: item.productItem.id,
							productName: `${item.product.name} ${item.productItem.name}`,
							productCode: item.productItem.productCode,
							unitPrice: centsToMoney(
								storedMoneyToCents(item.productItem.price),
							),
							qty: item.qty,
							subtotal: centsToMoney(itemSubtotal),
						};
					}),
					{ transaction: databaseTransaction },
				);

				for (const item of lockedItems) {
					const stockAfter = item.stockBefore - item.qty;

					await item.inventory.update(
						{ stock: stockAfter },
						{ transaction: databaseTransaction },
					);

					await InventoryMovements.create(
						{
							productItemId: item.productItem.id,
							transactionId: transactionRecord.id,
							userId: request.user.id,
							type: "reduction",
							quantity: item.qty,
							stockBefore: item.stockBefore,
							stockAfter,
							note: null,
						},
						{ transaction: databaseTransaction },
					);
				}

				await Payments.create(
					{
						transactionId: transactionRecord.id,
						paymentMethodId: paymentMethod.id,
						paymentReference: null,
						status: "paid",
						amount: centsToMoney(totalAmountCents),
						paidAmount: centsToMoney(payload.paidAmount),
						changeAmount: centsToMoney(changeAmountCents),
						expiredAt: null,
						paidAt,
					},
					{ transaction: databaseTransaction },
				);

				return { id: transactionRecord.id, reused: false };
			},
		);

		const transaction = await findCheckoutById(result.id);

		return response
			.status(
				result.reused
					? constants.HTTP_STATUS_OK
					: constants.HTTP_STATUS_CREATED,
			)
			.json({
				success: true,
				message: "Transaction completed successfully",
				data: toCheckoutResponse(transaction),
			});
	} catch (error) {
		if (error instanceof UniqueConstraintError && payload) {
			const existingTransaction = await findCheckoutByIdempotencyKey(
				payload.idempotencyKey,
			);

			if (existingTransaction) {
				if (!hasSamePayload(existingTransaction, payload, request.user.id)) {
					return next(
						createHttpError(
							constants.HTTP_STATUS_CONFLICT,
							"Idempotency-Key has already been used with a different payload",
						),
					);
				}

				return response.status(constants.HTTP_STATUS_OK).json({
					success: true,
					message: "Transaction completed successfully",
					data: toCheckoutResponse(existingTransaction),
				});
			}

			if (Object.hasOwn(error.fields ?? {}, "phone")) {
				return next(
					createHttpError(
						constants.HTTP_STATUS_CONFLICT,
						"Customer phone already exists",
					),
				);
			}
		}

		return next(error);
	}
}
