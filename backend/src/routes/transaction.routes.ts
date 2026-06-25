import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
  getCategorySpending,
} from "../controllers/transaction.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, createTransaction);
router.get("/", authMiddleware, getTransactions);
router.get("/summary", authMiddleware, getTransactionsSummary);
router.get("/summary/by-category", authMiddleware, getCategorySpending);
router.get("/:id", authMiddleware, getTransaction);
router.patch("/:id", authMiddleware, updateTransaction);
router.delete("/:id", authMiddleware, deleteTransaction);

export default router;
