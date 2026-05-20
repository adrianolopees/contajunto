import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export async function getCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.id },
    omit: { userId: true },
  });

  res.status(200).json({ categories });
}
