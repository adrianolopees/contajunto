import { Router } from "express";
import {
  getCards,
  getBills,
  createCard,
  updateCard,
  deleteCard,
} from "../controllers/card.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getCards);
router.get("/bills", authMiddleware, getBills);
router.post("/", authMiddleware, createCard);
router.patch("/:id", authMiddleware, updateCard);
router.delete("/:id", authMiddleware, deleteCard);

export default router;
