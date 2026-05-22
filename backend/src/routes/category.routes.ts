import { Router } from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, createCategory);
router.get("/", authMiddleware, getCategories);
router.patch("/:id", authMiddleware, updateCategory);

export default router;
