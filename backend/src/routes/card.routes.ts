import { Router } from "express";
import {
  getCards,
  getBills,
  payBill,
  createCard,
  updateCard,
  deleteCard,
} from "../controllers/card.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getCards);
router.get("/bills", authMiddleware, getBills);
router.post("/bills/pay", authMiddleware, payBill);
router.post("/", authMiddleware, createCard);
router.patch("/:id", authMiddleware, updateCard);
router.delete("/:id", authMiddleware, deleteCard);

export default router;
