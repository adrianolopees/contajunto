import { Request, Response } from "express";
import z from "zod";
import argon2 from "argon2";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(2, { error: "O nome deve ter no mínimo 2 caracteres" })
    .max(100, { error: "O nome não pode exceder 100 caracteres" }),
  email: z
    .string({ error: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "E-mail inválido" })),
  password: z
    .string({ error: "Senha é obrigatória" })
    .min(8, { error: "A senha deve ter no mínimo 8 caracteres" })
    .max(72, { error: "A senha não pode exceder 72 caracteres" }),
});

const loginSchema = z.object({
  email: z
    .string({ error: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "E-mail inválido" })),
  password: z
    .string({ error: "Senha é obrigatória" })
    .max(72, { error: "A senha não pode exceder 72 caracteres" }),
});

export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: z.flattenError(result.error) });
    return;
  }

  const { name, email, password } = result.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  res.status(201).json({ id: user.id, name: user.name, email: user.email });
}

export async function login(req: Request, res: Response) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: z.flattenError(result.error) });
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

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
  res.status(200).json({ accessToken });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401).json({ message: "Refresh token not found" });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored) {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.deleteMany({ where: { token } });
    res.status(401).json({ message: "Refresh token expired" });
    return;
  }

  const newRefreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { token } }),
    prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: stored.userId, expiresAt },
    }),
  ]);

  const accessToken = jwt.sign(
    { userId: stored.userId },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" },
  );

  res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
  res.status(200).json({ accessToken });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(204).send();
    return;
  }

  await prisma.refreshToken.deleteMany({ where: { token } });
  res.clearCookie("refreshToken", COOKIE_OPTIONS);
  res.status(204).send();
}
