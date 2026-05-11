import { Router } from "express";
import {
  createGroup,
  joinGroup,
  getGroup,
  getInviteCode,
  deleteGroup,
} from "../controllers/group.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, createGroup);
router.post("/join", authMiddleware, joinGroup);
router.get("/", authMiddleware, getGroup);
router.get("/invite", authMiddleware, getInviteCode);
router.delete("/leave", authMiddleware, deleteGroup);

export default router;
