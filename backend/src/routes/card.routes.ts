import { Router } from "express";
import {
  getCards,
  createCard,
  updateCard,
  deleteCard,
} from "../controllers/card.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getCards);
router.post("/", authMiddleware, createCard);
router.patch("/:id", authMiddleware, updateCard);
router.delete("/:id", authMiddleware, deleteCard);

export default router;
