import { Router } from "express";
import { createTransaction } from "../controllers/transation.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, createTransaction);

export default router;
