import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { CATALOG_META_ID } from "../lib/catalogSeed.js";

const testUser = {
  name: "Sync User",
  email: "sync@contajunto.com",
  password: "senha1234",
};

// grupo próprio pra não depender do que já existe em DefaultCategory no banco
// de teste — e pra poder limpar só o que este arquivo criou
const GROUP_NAME = "Grupo Teste Sync";
let groupId: string;

beforeAll(async () => {
  const group = await prisma.categoryGroup.create({
    data: { type: "EXPENSE", name: GROUP_NAME, color: "#000000", icon: "Package" },
  });
  groupId = group.id;
});

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.defaultCategory.deleteMany({ where: { groupId } });
  await prisma.catalogMeta.upsert({
    where: { id: CATALOG_META_ID },
    update: { version: 10, contentHash: "test" },
    create: { id: CATALOG_META_ID, version: 10, contentHash: "test" },
  });
});

afterAll(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.defaultCategory.deleteMany({ where: { groupId } });
  await prisma.categoryGroup.delete({ where: { id: groupId } });
  await prisma.catalogMeta.deleteMany();
  await prisma.$disconnect();
});

async function register() {
  await request(app).post("/api/auth/register").send(testUser);
}

async function loginAndListCategories(): Promise<{ name: string }[]> {
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: testUser.email, password: testUser.password });
  const res = await request(app)
    .get("/api/categories")
    .set("Authorization", `Bearer ${loginRes.body.accessToken}`);
  return res.body.categories;
}

async function userVersion() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: testUser.email },
    select: { categoriesVersion: true },
  });
  return user.categoriesVersion;
}

async function addDefaultCategory(name: string) {
  await prisma.defaultCategory.create({
    data: { type: "EXPENSE", name, color: "#000000", icon: "Package", groupId },
  });
}

describe("catalog sync on login", () => {
  it("should stamp a new user with the current catalog version", async () => {
    await register();

    expect(await userVersion()).toBe(10);
  });

  it("should copy new default categories on login after the catalog version advanced", async () => {
    await register(); // carimbado com 10

    // o seed rodou depois do registro: categoria nova + versão bumpada
    await addDefaultCategory("Nova Sync");
    await prisma.catalogMeta.update({
      where: { id: CATALOG_META_ID },
      data: { version: 11 },
    });

    const categories = await loginAndListCategories();

    expect(categories.some((c) => c.name === "Nova Sync")).toBe(true);
    expect(await userVersion()).toBe(11);
  });

  it("should not copy anything while the catalog version has not advanced", async () => {
    await register(); // 10

    // a linha apareceu em DefaultCategory mas o seed (único que bumpa a
    // versão) ainda não rodou — é exatamente a janela do incidente em produção
    await addDefaultCategory("Ainda Nao Semeada");

    const categories = await loginAndListCategories();

    expect(categories.some((c) => c.name === "Ainda Nao Semeada")).toBe(false);
    expect(await userVersion()).toBe(10);
  });

  it("should be idempotent: a second login at the same version changes nothing", async () => {
    await register();
    await addDefaultCategory("Nova Sync");
    await prisma.catalogMeta.update({
      where: { id: CATALOG_META_ID },
      data: { version: 11 },
    });

    const first = await loginAndListCategories();
    const second = await loginAndListCategories();

    expect(second).toHaveLength(first.length);
    expect(await userVersion()).toBe(11);
  });

  it("should treat a database without CatalogMeta as version 0 (never marks anyone as up to date)", async () => {
    await prisma.catalogMeta.deleteMany();

    await register();

    expect(await userVersion()).toBe(0);
  });
});

// estes usam o catálogo REAL semeado pelo pretest (grupo "Transporte"), porque
// o mapa de nomes legados vive em catalogData.ts
describe("legacy categories on sync", () => {
  const LEGACY = "Táxi e transporte privado urbano";
  const CURRENT = "Uber/99";

  async function userAndGroup() {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: testUser.email },
    });
    const group = await prisma.categoryGroup.findUniqueOrThrow({
      where: { name: "Transporte" },
    });
    return { user, group };
  }

  // simula uma conta antiga: tinha o nome legado em vez do atual
  async function turnIntoLegacyAccount() {
    const { user, group } = await userAndGroup();
    const current = await prisma.category.findUniqueOrThrow({
      where: { userId_groupId_name: { userId: user.id, groupId: group.id, name: CURRENT } },
    });
    await prisma.category.update({ where: { id: current.id }, data: { name: LEGACY } });
    return { user, group, legacyId: current.id };
  }

  async function bumpCatalog() {
    await prisma.catalogMeta.update({
      where: { id: CATALOG_META_ID },
      data: { version: 11 },
    });
  }

  async function addTransaction(userId: string, categoryId: string) {
    const now = new Date();
    await prisma.transaction.create({
      data: {
        userId,
        categoryId,
        type: "EXPENSE",
        amount: 10,
        description: "corrida",
        date: now,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });
  }

  it("should rename a legacy category to its current name, keeping its transactions", async () => {
    await register();
    const { user, legacyId } = await turnIntoLegacyAccount();
    await addTransaction(user.id, legacyId);
    await bumpCatalog();

    const categories = await loginAndListCategories();

    expect(categories.filter((c) => c.name === CURRENT)).toHaveLength(1);
    expect(categories.some((c) => c.name === LEGACY)).toBe(false);
    const renamed = await prisma.category.findUniqueOrThrow({ where: { id: legacyId } });
    expect(renamed.name).toBe(CURRENT);
    expect(await prisma.transaction.count({ where: { categoryId: legacyId } })).toBe(1);
  });

  it("should delete an unused legacy category when the current one already exists", async () => {
    await register();
    const { user, group } = await userAndGroup();
    await prisma.category.create({
      data: { userId: user.id, groupId: group.id, type: "EXPENSE", name: LEGACY, color: "#000", icon: "Car" },
    });
    await bumpCatalog();

    const categories = await loginAndListCategories();

    expect(categories.filter((c) => c.name === CURRENT)).toHaveLength(1);
    expect(categories.some((c) => c.name === LEGACY)).toBe(false);
  });

  it("should delete a category that left the catalog when it has no transactions", async () => {
    await register();
    const { user, group } = await userAndGroup();
    await prisma.category.create({
      data: { userId: user.id, groupId: group.id, type: "EXPENSE", name: "Sumiu do catálogo", color: "#000", icon: "Car" },
    });
    await bumpCatalog();

    const categories = await loginAndListCategories();

    expect(categories.some((c) => c.name === "Sumiu do catálogo")).toBe(false);
  });

  it("should keep a category that left the catalog when it still has transactions", async () => {
    await register();
    const { user, group } = await userAndGroup();
    const stale = await prisma.category.create({
      data: { userId: user.id, groupId: group.id, type: "EXPENSE", name: "Sumiu mas tem gasto", color: "#000", icon: "Car" },
    });
    await addTransaction(user.id, stale.id);
    await bumpCatalog();

    const categories = await loginAndListCategories();

    expect(categories.some((c) => c.name === "Sumiu mas tem gasto")).toBe(true);
  });
});
