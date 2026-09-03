import { Router } from "express";
import {
  getCategories,
  getDefaultCategories,
} from "../controllers/category.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getCategories);
router.get("/default", getDefaultCategories);

export default router;
