import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("Critical: JWT_SECRET not defined");
    res.status(500).json({ message: "Internal server error" });
    return;
  }

  if (!authHeader) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const [scheme, token] = parts;

  if (scheme !== "Bearer") {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    if (!decoded.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    req.user = { id: decoded.userId };
  } catch {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
}
