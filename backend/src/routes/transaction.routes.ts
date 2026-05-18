import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
} from "../controllers/transation.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, createTransaction);
router.get("/", authMiddleware, getTransactions);
router.get("/:id", authMiddleware, getTransaction);
router.patch("/:id", authMiddleware, updateTransaction);

export default router;
