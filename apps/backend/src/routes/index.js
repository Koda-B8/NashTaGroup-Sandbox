import { Router } from "express";

import authRoute from "./AuthRoute.js";
import brandRoute from "./BrandRoute.js";
import cashierProductRoute from "./CashierProductRoute.js";
import categoryRoute from "./CategoryRoute.js";
import inventoryRoute from "./InventoryRoute.js";
import paymentMethodRoute from "./PaymentMethodRoute.js";
import productImageRoute from "./ProductImageRoute.js";
import productItemRoute from "./ProductItemRoute.js";
import productRoute from "./ProductRoute.js";
import userRoute from "./UserRoute.js";

const router = Router();

router.use("/auth", authRoute);
router.use("/categories", categoryRoute);
router.use("/brands", brandRoute);
router.use("/cashier/products", cashierProductRoute);
router.use("/payment-methods", paymentMethodRoute);
router.use("/product-images", productImageRoute);
router.use("/inventories", inventoryRoute);
router.use("/products", productRoute);
router.use("/product-items", productItemRoute);
router.use("/users", userRoute);

export default router;
