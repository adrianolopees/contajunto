import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import z from "zod";

const updateCategorySchema = z.object({
  monthlyLimit: z.number().positive().nullable().optional(),
});

export async function getCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.id },
    include: { group: true },
    omit: { userId: true, groupId: true },
    orderBy: { name: "asc" },
  });

  res.status(200).json({ categories });
}

export async function updateCategory(req: Request, res: Response) {
  const categoryId = z.uuid().parse(req.params.id);
  const { monthlyLimit } = updateCategorySchema.parse(req.body);

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId: req.user.id },
  });
  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: { monthlyLimit },
    include: { group: true },
    omit: { userId: true, groupId: true },
  });

  res.status(200).json({ category: updatedCategory });
}

export async function getDefaultCategories(req: Request, res: Response) {
  const categoriesDefault = await prisma.defaultCategory.findMany({
    include: { group: true },
    orderBy: { name: "asc" },
  });

  res.status(200).json({ categoriesDefault });
}
