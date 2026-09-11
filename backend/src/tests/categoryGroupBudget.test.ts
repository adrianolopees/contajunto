import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { createAndAuthenticateUser } from "./helpers.js";

beforeEach(async () => {
  await prisma.categoryGroupBudget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.categoryGroupBudget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// pretest semeia o catálogo real (ver category.test.ts) — pega um grupo real
// em vez de um id inventado, pra testar contra o catálogo de verdade
async function expenseGroupId() {
  const group = await prisma.categoryGroup.findFirst({
    where: { type: "EXPENSE" },
  });
  if (!group) throw new Error("Nenhum grupo de despesa no catálogo semeado");
  return group.id;
}

async function incomeGroupId() {
  const group = await prisma.categoryGroup.findFirst({
    where: { type: "INCOME" },
  });
  if (!group) throw new Error("Nenhum grupo de receita no catálogo semeado");
  return group.id;
}

describe("GET /category-budgets", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/category-budgets");
    expect(res.status).toBe(401);
  });

  it("should return an empty list for a new user", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.budgets).toEqual([]);
  });
});

describe("PUT /category-budgets", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).put("/api/category-budgets");
    expect(res.status).toBe(401);
  });

  it("should set a budget for a category group", async () => {
    const accessToken = await createAndAuthenticateUser();
    const groupId = await expenseGroupId();

    const res = await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ budgets: [{ groupId, amount: 500 }] });

    expect(res.status).toBe(200);
    expect(res.body.budgets).toEqual([{ groupId, amount: "500" }]);
  });

  it("should update an existing budget instead of duplicating it", async () => {
    const accessToken = await createAndAuthenticateUser();
    const groupId = await expenseGroupId();

    await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ budgets: [{ groupId, amount: 500 }] });

    const res = await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ budgets: [{ groupId, amount: 800 }] });

    expect(res.status).toBe(200);
    expect(res.body.budgets).toEqual([{ groupId, amount: "800" }]);
  });

  it("should remove the budget when amount is null", async () => {
    const accessToken = await createAndAuthenticateUser();
    const groupId = await expenseGroupId();

    await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ budgets: [{ groupId, amount: 500 }] });

    const res = await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ budgets: [{ groupId, amount: null }] });

    expect(res.status).toBe(200);
    expect(res.body.budgets).toEqual([]);
  });

  it("should return 404 for an income category group", async () => {
    const accessToken = await createAndAuthenticateUser();
    const groupId = await incomeGroupId();

    const res = await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ budgets: [{ groupId, amount: 500 }] });

    expect(res.status).toBe(404);
  });

  it("should return 404 for a non-existent group id", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        budgets: [
          { groupId: "00000000-0000-0000-0000-000000000000", amount: 500 },
        ],
      });

    expect(res.status).toBe(404);
  });

  it("should return 400 for a non-positive amount", async () => {
    const accessToken = await createAndAuthenticateUser();
    const groupId = await expenseGroupId();

    const res = await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ budgets: [{ groupId, amount: -10 }] });

    expect(res.status).toBe(400);
  });

  it("should isolate budgets by user", async () => {
    const tokenA = await createAndAuthenticateUser();
    const tokenB = await createAndAuthenticateUser({
      name: "Second User",
      email: "second@contajunto.com",
      password: "senha1234",
    });
    const groupId = await expenseGroupId();

    await request(app)
      .put("/api/category-budgets")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ budgets: [{ groupId, amount: 500 }] });

    const res = await request(app)
      .get("/api/category-budgets")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.budgets).toEqual([]);
  });
});
