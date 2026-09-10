import { Router } from "express";

import authRoute from "./AuthRoute.js";
import brandRoute from "./BrandRoute.js";
import categoryRoute from "./CategoryRoute.js";
import productItemRoute from "./ProductItemRoute.js";
import productRoute from "./ProductRoute.js";
import userRoute from "./UserRoute.js";

const router = Router();

router.use("/auth", authRoute);
router.use("/categories", categoryRoute);
router.use("/brands", brandRoute);
router.use("/products", productRoute);
router.use("/product-items", productItemRoute);
router.use("/users", userRoute);

export default router;
