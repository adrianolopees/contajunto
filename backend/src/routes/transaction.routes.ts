import { Router } from "express";
import {
  createTransaction,
  getTransactions,
} from "../controllers/transation.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, createTransaction);
router.get("/", authMiddleware, getTransactions);

export default router;
