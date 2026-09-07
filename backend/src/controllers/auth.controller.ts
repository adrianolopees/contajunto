import { Request, Response } from "express";
import z from "zod";
import argon2 from "argon2";
import prisma from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { getCatalogVersion, syncUserCategories } from "../lib/categoryCatalog.js";
import { hashToken } from "../lib/token.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // "lax" (não "strict"): a SPA e a API compartilham origem, então o cookie
  // já é first-party. "strict" derrubaria a sessão em navegação vinda de fora
  // (link, e-mail, PWA aberto pela home screen em alguns browsers).
  sameSite: "lax" as const,
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
    .min(8, { message: "A senha deve ter no mínimo 8 caracteres" })
    .max(72, { error: "A senha não pode exceder 72 caracteres" }),
});

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function register(req: Request, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const [defaultCategories, catalogVersion, passwordHash] = await Promise.all([
    prisma.defaultCategory.findMany(),
    getCatalogVersion(),
    argon2.hash(password),
  ]);

  try {
    const user = await prisma.$transaction(async (tx) => {
      // recebe o catálogo inteiro agora, então já nasce carimbado com a versão
      // corrente — o sync do login não tem nada a fazer por ele
      const newUser = await tx.user.create({
        data: { name, email, passwordHash, categoriesVersion: catalogVersion },
        omit: { passwordHash: true, categoriesVersion: true },
      });

      await tx.category.createMany({
        data: defaultCategories.map((cat) => ({
          type: cat.type,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          groupId: cat.groupId,
          userId: newUser.id,
        })),
      });
      return newUser;
    });

    res.status(201).json({ user });
  } catch (err) {
    // dois registros do mesmo e-mail em paralelo passam pelo findUnique acima
    // e um deles cai na constraint — é o mesmo 409 do caminho normal, não o
    // "Resource already exists" genérico do middleware
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }
    throw err;
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const passwordMatch = await argon2.verify(user.passwordHash, password);
  if (!passwordMatch) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const catalogVersion = await getCatalogVersion();
  if (user.categoriesVersion < catalogVersion) {
    await syncUserCategories(user.id, catalogVersion);
  }

  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = crypto.randomBytes(64).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt,
    },
  });

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
  res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      monthlyBudget: user.monthlyBudget,
      familyGroupId: user.familyGroupId,
    },
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401).json({ message: "Refresh token not found" });
    return;
  }

  const tokenHash = hashToken(token);
  const stored = await prisma.refreshToken.findUnique({
    where: { token: tokenHash },
  });

  if (!stored) {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.deleteMany({ where: { token: tokenHash } });
    res.status(401).json({ message: "Refresh token expired" });
    return;
  }

  const newRefreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
  });

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { token: tokenHash } }),
    prisma.refreshToken.create({
      data: {
        token: hashToken(newRefreshToken),
        userId: stored.userId,
        expiresAt,
      },
    }),
  ]);

  const accessToken = jwt.sign({ userId: stored.userId }, JWT_SECRET, {
    expiresIn: "15m",
  });

  res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
  res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      monthlyBudget: user.monthlyBudget,
      familyGroupId: user.familyGroupId,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(204).send();
    return;
  }

  await prisma.refreshToken.deleteMany({ where: { token: hashToken(token) } });
  res.clearCookie("refreshToken", COOKIE_OPTIONS);
  res.status(204).send();
}
