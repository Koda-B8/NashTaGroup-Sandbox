import { Router } from "express";

import authRoute from "./AuthRoute.js";
import brandRoute from "./BrandRoute.js";
import cashierProductRoute from "./CashierProductRoute.js";
import categoryRoute from "./CategoryRoute.js";
import checkoutRoute from "./CheckoutRoute.js";
import customerRoute from "./CustomerRoute.js";
import inventoryMovementRoute from "./InventoryMovementRoute.js";
import inventoryRoute from "./InventoryRoute.js";
import paymentMethodRoute from "./PaymentMethodRoute.js";
import productImageRoute from "./ProductImageRoute.js";
import productItemRoute from "./ProductItemRoute.js";
import productRoute from "./ProductRoute.js";
import reportRoute from "./ReportRoute.js";
import transactionRoute from "./TransactionRoute.js";
import userRoute from "./UserRoute.js";

const router = Router();

router.use("/auth", authRoute);
router.use("/categories", categoryRoute);
router.use("/brands", brandRoute);
router.use("/cashier/products", cashierProductRoute);
router.use("/checkout", checkoutRoute);
router.use("/customers", customerRoute);
router.use("/payment-methods", paymentMethodRoute);
router.use("/product-images", productImageRoute);
router.use("/inventories", inventoryRoute);
router.use("/inventory-movements", inventoryMovementRoute);
router.use("/products", productRoute);
router.use("/product-items", productItemRoute);
router.use("/reports", reportRoute);
router.use("/transactions", transactionRoute);
router.use("/users", userRoute);

export default router;
