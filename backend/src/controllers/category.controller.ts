import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import z from "zod";

const categorySchema = z.object({
  name: z.string().min(2),
  color: z.string(),
  icon: z.string(),
});

export async function createCategory(req: Request, res: Response) {
  const { name, color, icon } = categorySchema.parse(req.body);
  const userId = req.user.id;

  const existingCategory = await prisma.category.findFirst({
    where: { userId: userId, name: name },
  });

  if (existingCategory) {
    res.status(409).json({ message: "category already exists" });
    return;
  }

  const newCategory = await prisma.category.create({
    data: { userId: userId, name: name, color: color, icon: icon },
    omit: { userId: true },
  });

  res.status(201).json({ newCategory });
}

export async function getCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.id },
    omit: { userId: true },
  });

  res.status(200).json({ categories });
}
