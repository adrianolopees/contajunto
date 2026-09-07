import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { Prisma } from "../generated/prisma/index.js";

// o 4º parâmetro é obrigatório: é pela aridade que o Express distingue um
// error handler de um middleware comum, mesmo que nunca chamemos next()
export default function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
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
    if (err.code === "P2002") {
      res.status(409).json({ message: "Resource already exists" });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}
