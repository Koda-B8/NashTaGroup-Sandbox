import { Router } from "express";

import authRoute from "./AuthRoute.js";
import categoryRoute from "./CategoryRoute.js";

const router = Router();

router.use("/auth", authRoute);
router.use("/categories", categoryRoute);

export default router;
