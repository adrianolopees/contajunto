import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getMe } from "../controllers/user.controller.js";

const router = Router();

router.get("/me", authMiddleware, getMe);

export default router;
