import { Request, Response } from "express";
import z from "zod";
import argon2 from "argon2";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

const loginShema = z.object({
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

export async function login(req: Request, res: Response) {
  const result = loginShema.safeParse(req.body);

  if (!result.success) {
    res.status(401).json({ errors: z.treeifyError(result.error) });
    return;
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const passwordMatch = await argon2.verify(user.passwordHash, password);
  if (!passwordMatch) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  const refreshToken = crypto.randomBytes(64).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ accessToken });
}
