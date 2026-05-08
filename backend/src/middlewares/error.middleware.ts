import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

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
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}
