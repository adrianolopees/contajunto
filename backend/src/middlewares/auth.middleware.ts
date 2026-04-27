import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer") {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = { id: (decoded as jwt.JwtPayload).userId };
  } catch {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
}
