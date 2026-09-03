import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export async function getCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.id },
    include: { group: true },
    omit: { userId: true, groupId: true },
    orderBy: { name: "asc" },
  });

  res.status(200).json({ categories });
}

export async function getDefaultCategories(req: Request, res: Response) {
  const categoriesDefault = await prisma.defaultCategory.findMany({
    include: { group: true },
    orderBy: { name: "asc" },
  });

  res.status(200).json({ categoriesDefault });
}
