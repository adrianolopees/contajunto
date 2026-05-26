import { Router } from "express";
import {
  createGroup,
  joinGroup,
  getGroup,
  getInviteCode,
  leaveGroup,
  getGroupTransactions,
  getGroupTransactionsSummary,
} from "../controllers/group.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, createGroup);
router.post("/join", authMiddleware, joinGroup);
router.get("/", authMiddleware, getGroup);
router.get("/invite", authMiddleware, getInviteCode);
router.get("/transactions", authMiddleware, getGroupTransactions);
router.get(
  "/transactions/summary",
  authMiddleware,
  getGroupTransactionsSummary,
);
router.delete("/leave", authMiddleware, leaveGroup);

export default router;
