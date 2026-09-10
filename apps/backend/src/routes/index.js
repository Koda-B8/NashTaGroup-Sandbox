import { Router } from "express";

import authRoute from "./AuthRoute.js";
import categoryRoute from "./CategoryRoute.js";
import userRoute from "./UserRoute.js";

const router = Router();

router.use("/auth", authRoute);
router.use("/categories", categoryRoute);
router.use("/users", userRoute);

export default router;
