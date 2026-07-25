import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import z from "zod";

const categorySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  name: z.string().min(2),
  color: z.string(),
  icon: z.string(),
});

const updateCategorySchema = categorySchema.partial();

export async function createCategory(req: Request, res: Response) {
  const { type, name, color, icon } = categorySchema.parse(req.body);
  const userId = req.user.id;

  const existingCategory = await prisma.category.findFirst({
    where: { userId, name },
  });

  if (existingCategory) {
    res.status(409).json({ message: "category already exists" });
    return;
  }

  const category = await prisma.category.create({
    data: { userId, type, name, color, icon },
    omit: { userId: true },
  });

  res.status(201).json({ category });
}

export async function getCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.id },
    omit: { userId: true },
    orderBy: { name: "asc" },
  });

  res.status(200).json({ categories });
}

export async function updateCategory(req: Request, res: Response) {
  const categoryId = z.uuid().parse(req.params.id);
  const { name, color, icon } = updateCategorySchema.parse(req.body);

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId: req.user.id },
  });
  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: { name, color, icon },
    omit: { userId: true },
  });

  res.status(200).json({ category: updatedCategory });
}

export async function getDefaultCategories(req: Request, res: Response) {
  const categoriesDefault = await prisma.defaultCategory.findMany();

  res.status(200).json({ categoriesDefault });
}

export async function deleteCategory(req: Request, res: Response) {
  const categoryId = z.uuid().parse(req.params.id);

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId: req.user.id },
  });

  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  res.status(200).json({ message: "Category deleted successfully" });
}
