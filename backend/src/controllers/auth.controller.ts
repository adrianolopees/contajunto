import { Request, Response } from "express";
import z from "zod";
import argon2 from "argon2";
import prisma from "../lib/prisma.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: z.treeifyError(result.error) });
    return;
  }

  const { name, email, password } = result.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    res.status(409).json({ message: "Email already un use" });
    return;
  }

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  res.status(201).json({ id: user.id, name: user.name, email: user.email });
}
