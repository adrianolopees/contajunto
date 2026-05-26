import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
} from "../controllers/auth.controller.js";
import rateLimit from "express-rate-limit";

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Too many attempts, try again later" },
});

const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { error: "Too many attempts, try again later" },
});

const router = Router();

router.post(
  "/register",
  process.env.NODE_ENV === "test" ? [] : registerRateLimit,
  register,
);
router.post(
  "/login",
  process.env.NODE_ENV === "test" ? [] : loginRateLimit,
  login,
);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
