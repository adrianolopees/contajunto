import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { Prisma } from "../generated/prisma/index.js";

export default function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({ errors: z.flattenError(err) });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Resource not found" });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}
