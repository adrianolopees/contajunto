import { Router } from "express";
import { createGroup, joinGroup } from "../controllers/group.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, createGroup);
router.post("/join", authMiddleware, joinGroup);

export default router;
