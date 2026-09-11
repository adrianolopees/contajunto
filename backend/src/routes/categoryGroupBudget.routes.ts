import { Router } from "express";
import {
  getCategoryGroupBudgets,
  setCategoryGroupBudgets,
} from "../controllers/categoryGroupBudget.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getCategoryGroupBudgets);
router.put("/", authMiddleware, setCategoryGroupBudgets);

export default router;
