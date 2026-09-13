import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { createAndAuthenticateUser } from "./helpers.js";
import { getBusinessMonthYear } from "../lib/date.js";

beforeEach(async () => {
  await prisma.invoicePayment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.invoicePayment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.category.deleteMany();
  await prisma.categoryGroup.deleteMany({ where: { name: TEST_GROUP_NAME } });
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// categorias criadas direto no banco pra não depender do catálogo semeado no
// banco de teste (que pode não ter os dois tipos)
const TEST_GROUP_NAME = "Grupo Teste Patch";

async function createCategoryFor(
  accessToken: string,
  type: "EXPENSE" | "INCOME",
  name: string,
) {
  const me = await request(app)
    .get("/api/users/me")
    .set("Authorization", `Bearer ${accessToken}`);
  const group = await prisma.categoryGroup.upsert({
    where: { name: TEST_GROUP_NAME },
    update: {},
    create: { type, name: TEST_GROUP_NAME, color: "#000000", icon: "Package" },
  });
  return prisma.category.create({
    data: {
      type,
      name,
      color: "#000000",
      icon: "Package",
      groupId: group.id,
      userId: me.body.user.id,
    },
  });
}

const validTransaction = {
  amount: 49.9,
  type: "EXPENSE",
  description: "Mercado Extra",
};

const user2 = {
  name: "Test user2",
  email: "test2@contajunto.com",
  password: "senha1234",
};

describe("POST /transactions", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).post("/api/transactions").send(validTransaction);

    expect(res.status).toBe(401);
  });

  it("should return 400 when body is invalid", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: -10, type: "INVALID", description: "ok" });

    expect(res.status).toBe(400);
  });

  it("should return 201 and create transaction successfully", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      transaction: {
        id: expect.any(String),
        type: expect.any(String),
      },
    });
  });

  it("should return 201 and create transaction without a description", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 49.9, type: "EXPENSE" });

    expect(res.status).toBe(201);
    expect(res.body.transaction.description).toBe("");
  });

  it("should return 201 and persist the payment method", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTransaction, paymentMethod: "CREDIT" });

    expect(res.status).toBe(201);
    expect(res.body.transaction.paymentMethod).toBe("CREDIT");
  });

  it("should return 201 with null payment method when none is sent", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    expect(res.status).toBe(201);
    expect(res.body.transaction.paymentMethod).toBeNull();
  });

  it("should return 400 when payment method is not a known value", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTransaction, paymentMethod: "BOLETO" });

    expect(res.status).toBe(400);
  });

  it("should persist the card when a credit expense is sent with a cardId", async () => {
    const accessToken = await createAndAuthenticateUser();
    const card = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Nubank", closingDay: 3, dueDay: 10, color: "#8b5cf6" });

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        ...validTransaction,
        paymentMethod: "CREDIT",
        cardId: card.body.card.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction.cardId).toBe(card.body.card.id);
  });

  it("should return 400 when a cardId is sent without credit payment", async () => {
    const accessToken = await createAndAuthenticateUser();
    const card = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Nubank", closingDay: 3, dueDay: 10, color: "#8b5cf6" });

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        ...validTransaction,
        paymentMethod: "DEBIT",
        cardId: card.body.card.id,
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 when an income carries a payment method", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 1000,
        type: "INCOME",
        description: "Salário",
        paymentMethod: "PIX",
      });

    expect(res.status).toBe(400);
  });

  it("should return 404 when the cardId belongs to another user", async () => {
    const accessToken = await createAndAuthenticateUser();
    const otherToken = await createAndAuthenticateUser(user2);
    const card = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ name: "Alheio", closingDay: 5, dueDay: 12, color: "#8b5cf6" });

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        ...validTransaction,
        paymentMethod: "CREDIT",
        cardId: card.body.card.id,
      });

    expect(res.status).toBe(404);
  });
});

describe("POST /transactions — parcelamento", () => {
  it("should return 400 when installments > 1 on a non-credit expense", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTransaction, paymentMethod: "DEBIT", installments: 3 });

    expect(res.status).toBe(400);
  });

  it("should return 400 when installments > 1 on income", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 100, type: "INCOME", installments: 3 });

    expect(res.status).toBe(400);
  });

  it("should return 400 when installments exceeds the max", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        ...validTransaction,
        paymentMethod: "CREDIT",
        installments: 13,
      });

    expect(res.status).toBe(400);
  });

  it("should create N transactions sharing an installmentGroupId, split evenly with the remainder on the last", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 100,
        type: "EXPENSE",
        description: "Notebook",
        paymentMethod: "CREDIT",
        installments: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body.transactions).toHaveLength(3);
    const groupId = res.body.transactions[0].installmentGroupId;
    expect(groupId).toEqual(expect.any(String));

    const amounts = res.body.transactions.map((t: { amount: string }) =>
      Number(t.amount),
    );
    expect(amounts).toEqual([33.33, 33.33, 33.34]);
    expect(
      res.body.transactions.every(
        (t: { installmentGroupId: string }) => t.installmentGroupId === groupId,
      ),
    ).toBe(true);
    expect(
      res.body.transactions.map(
        (t: { installmentNumber: number }) => t.installmentNumber,
      ),
    ).toEqual([1, 2, 3]);
    expect(
      res.body.transactions.every(
        (t: { installmentTotal: number }) => t.installmentTotal === 3,
      ),
    ).toBe(true);
    // res.body.transaction (singular) continua existindo, é a 1ª parcela —
    // mantém o contrato de quem só olha essa chave
    expect(res.body.transaction.id).toBe(res.body.transactions[0].id);
  });

  it("should date each installment one month after the previous one", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 90,
        type: "EXPENSE",
        paymentMethod: "CREDIT",
        installments: 3,
      });

    const months = res.body.transactions.map(
      (t: { month: number }) => t.month,
    );
    const uniqueMonths = new Set(months);
    expect(uniqueMonths.size).toBe(3);
  });

  it("should not set installment fields on a regular (non-parceled) transaction", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    expect(res.body.transaction.installmentGroupId).toBeNull();
  });
});

describe("GET /transactions", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/transactions");

    expect(res.status).toBe(401);
  });

  it("should return 200 and empty array when user has no transactions", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });

  it("should return 200 and list all transactions", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
  });

  it("should filter transactions by month and year", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const now = new Date();
    const res = await request(app)
      .get(
        `/api/transactions?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      )
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
  });

  it("should return empty array when filter does not match", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/api/transactions?month=1&year=2000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });

  it("should only return transactions of the authenticated user", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser({
      name: "User 2",
      email: "user2@contajunto.com",
      password: "senha1234",
    });

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${accessToken2}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });
});

describe("PATCH /transactions/:id", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app)
      .patch("/api/transactions/550e8400-e29b-41d4-a716-446655440000")
      .send({ description: "Updated" });

    expect(res.status).toBe(401);
  });

  it("should return 400 when params is not a valid UUID", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/transactions/abc")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ description: "Updated" });

    expect(res.status).toBe(400);
  });

  it("should return 400 when body has invalid fields", async () => {
    const accessToken = await createAndAuthenticateUser();

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: -50, type: "INVALID" });

    expect(res.status).toBe(400);
  });

  it("should return 404 when transaction does not exist", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/transactions/550e8400-e29b-41d4-a716-446655440000")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ description: "Updated" });

    expect(res.status).toBe(404);
  });

  it("should return 404 when transaction belongs to another user", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser(user2);

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ description: "Trying to update" });

    expect(res.status).toBe(404);
  });

  it("should return 404 when categoryId does not belong to the user", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser({
      name: "Outro",
      email: "outro@email.com",
      password: "senha1234",
    });

    const categoriesRes = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${accessToken2}`);
    const otherUserCategory = categoriesRes.body.categories[0];

    const transactionRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/api/transactions/${transactionRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken1}`)
      .send({ categoryId: otherUserCategory.id });

    expect(res.status).toBe(404);
  });

  it("should return 200 and update transaction fields successfully", async () => {
    const accessToken = await createAndAuthenticateUser();

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ description: "Mercado Novo", amount: 99.9 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      transaction: {
        id: createRes.body.transaction.id,
        description: "Mercado Novo",
        amount: "99.9",
      },
    });
  });

  it("should return 200 when only one field is updated (partial update)", async () => {
    const accessToken = await createAndAuthenticateUser();

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ type: "INCOME" });

    expect(res.status).toBe(200);
    expect(res.body.transaction.type).toBe("INCOME");
    expect(res.body.transaction.description).toBe(
      validTransaction.description,
    );
  });

  it("should update the payment method", async () => {
    const accessToken = await createAndAuthenticateUser();

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTransaction, paymentMethod: "DEBIT" });

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ paymentMethod: "PIX" });

    expect(res.status).toBe(200);
    expect(res.body.transaction.paymentMethod).toBe("PIX");
  });

  it("should clear the payment method when sent as null", async () => {
    const accessToken = await createAndAuthenticateUser();

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTransaction, paymentMethod: "CREDIT" });

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ paymentMethod: null });

    expect(res.status).toBe(200);
    expect(res.body.transaction.paymentMethod).toBeNull();
  });

  it("should return 400 when changing the type while keeping a category of the old type", async () => {
    const accessToken = await createAndAuthenticateUser();
    const expenseCategory = await createCategoryFor(accessToken, "EXPENSE", "Mercado");

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTransaction, categoryId: expenseCategory.id });

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ type: "INCOME" });

    expect(res.status).toBe(400);
  });

  it("should return 200 when changing the type together with a category of the new type", async () => {
    const accessToken = await createAndAuthenticateUser();
    const expenseCategory = await createCategoryFor(accessToken, "EXPENSE", "Mercado");
    const incomeCategory = await createCategoryFor(accessToken, "INCOME", "Freela");

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTransaction, categoryId: expenseCategory.id });

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ type: "INCOME", categoryId: incomeCategory.id });

    expect(res.status).toBe(200);
    expect(res.body.transaction.type).toBe("INCOME");
    expect(res.body.transaction.categoryId).toBe(incomeCategory.id);
  });

  it("should return 200 when changing the type and clearing the category", async () => {
    const accessToken = await createAndAuthenticateUser();
    const expenseCategory = await createCategoryFor(accessToken, "EXPENSE", "Mercado");

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTransaction, categoryId: expenseCategory.id });

    const res = await request(app)
      .patch(`/api/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ type: "INCOME", categoryId: null });

    expect(res.status).toBe(200);
    expect(res.body.transaction.categoryId).toBeNull();
  });
});

describe("GET /transactions/:id", () => {
  it("should return 400 when params is not UUID valid", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/transactions/abc")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
  });

  it("should return 404 transaction not found", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/transactions/550e8400-e29b-41d4-a716-446655440000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 404 transaction not found", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser(user2);

    const res1 = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res2 = await request(app)
      .get(`/api/transactions/${res1.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken2}`);

    expect(res2.status).toBe(404);
  });

  it("should return 200 Transaction successfully completed.", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res2 = await request(app)
      .get(`/api/transactions/${res.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body).toMatchObject({
      transaction: {
        id: expect.any(String),
        description: expect.any(String),
        type: expect.any(String),
        amount: expect.any(String),
        category: null,
      },
    });
  });
});

describe("DELETE /transactions/:id", () => {
  it("should return 400 when params is not UUID valid", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .delete("/api/transactions/abc")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
  });

  it("should return 404 transaction not found", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .delete("/api/transactions/550e8400-e29b-41d4-a716-446655440000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 404 when transaction belongs to another user", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser(user2);

    const res1 = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res2 = await request(app)
      .delete(`/api/transactions/${res1.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken2}`);

    expect(res2.status).toBe(404);
  });

  it("should return 200 transaction deleted with succefull", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res1 = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res2 = await request(app)
      .delete(`/api/transactions/${res1.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
  });
});

describe("DELETE /transactions/:id — escopo de parcela", () => {
  async function createInstallments(accessToken: string, count = 3) {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 90,
        type: "EXPENSE",
        description: "Parcelado",
        paymentMethod: "CREDIT",
        installments: count,
      });
    return res.body.transactions as { id: string }[];
  }

  it("should delete only the targeted installment by default (scope=self)", async () => {
    const accessToken = await createAndAuthenticateUser();
    const [first, second, third] = await createInstallments(accessToken);

    const res = await request(app)
      .delete(`/api/transactions/${second.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const stillThere = await prisma.transaction.findMany({
      where: { id: { in: [first.id, second.id, third.id] } },
    });
    expect(stillThere.map((t) => t.id).sort()).toEqual(
      [first.id, third.id].sort(),
    );
  });

  it("should delete this and future installments with scope=group_forward, keeping past ones", async () => {
    const accessToken = await createAndAuthenticateUser();
    const [first, second, third] = await createInstallments(accessToken);

    const res = await request(app)
      .delete(`/api/transactions/${second.id}?scope=group_forward`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const stillThere = await prisma.transaction.findMany({
      where: { id: { in: [first.id, second.id, third.id] } },
    });
    expect(stillThere.map((t) => t.id)).toEqual([first.id]);
  });

  it("should ignore scope=group_forward on a transaction with no installment group", async () => {
    const accessToken = await createAndAuthenticateUser();

    const created = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .delete(`/api/transactions/${created.body.transaction.id}?scope=group_forward`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });
});

describe("GET /transactions/summary", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/transactions/summary");

    expect(res.status).toBe(401);
  });

  it("should return zeroed values when user has no transactions", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/transactions/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ income: 0, expense: 0, balance: 0 });
  });

  it("should aggregate income and expense", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 100, type: "INCOME", description: "Salário" });

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 40, type: "EXPENSE", description: "Mercado" });

    const res = await request(app)
      .get("/api/transactions/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ income: 100, expense: 40, balance: 60 });
  });

  it("should filter summary by month and year", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 200, type: "INCOME", description: "Salário" });

    const now = new Date();
    const res = await request(app)
      .get(
        `/api/transactions/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      )
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ income: 200, expense: 0, balance: 200 });
  });

  it("should return zeroed values when filter does not match", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 200, type: "INCOME", description: "Salário" });

    const res = await request(app)
      .get("/api/transactions/summary?month=1&year=2000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ income: 0, expense: 0, balance: 0 });
  });

  it("should not include transactions from other users", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser(user2);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ amount: 500, type: "INCOME", description: "Renda outro user" });

    const res = await request(app)
      .get("/api/transactions/summary")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ income: 0, expense: 0, balance: 0 });
  });
});

describe("GET /transactions/summary — regime de caixa", () => {
  it("should not count a credit expense until its invoice is paid", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 300,
        type: "EXPENSE",
        description: "Compra crédito",
        paymentMethod: "CREDIT",
      });

    const res = await request(app)
      .get("/api/transactions/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ income: 0, expense: 0, balance: 0 });
  });

  it("should count debit/pix/cash expenses immediately", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 50, type: "EXPENSE", description: "Mercado", paymentMethod: "PIX" });

    const res = await request(app)
      .get("/api/transactions/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.body).toMatchObject({ income: 0, expense: 50, balance: -50 });
  });

  it("should count an expense with no paymentMethod (legacy/unset) immediately", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 40, type: "EXPENSE", description: "Sem método" });

    const res = await request(app)
      .get("/api/transactions/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.body).toMatchObject({ income: 0, expense: 40, balance: -40 });
  });

  it("should count paying a card invoice as an outflow", async () => {
    const accessToken = await createAndAuthenticateUser();
    const me = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);
    const card = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Nubank", closingDay: 3, dueDay: 10, color: "#8b5cf6" });

    const { month, year } = getBusinessMonthYear();
    await prisma.invoicePayment.create({
      data: {
        cardId: card.body.card.id,
        userId: me.body.user.id,
        amount: 120,
        closeYear: year,
        closeMonth: month,
        paidOn: new Date(),
        month,
        year,
      },
    });

    const res = await request(app)
      .get("/api/transactions/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.body).toMatchObject({ income: 0, expense: 120, balance: -120 });
  });
});

describe("GET /transactions/summary/by-category", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/transactions/summary/by-category");

    expect(res.status).toBe(401);
  });

  it("should return empty array when user has no transactions", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/transactions/summary/by-category")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.categorySpending).toEqual([]);
  });

  it("should aggregate expense total for a category, grouped by its parent group", async () => {
    const accessToken = await createAndAuthenticateUser();

    const categoriesRes = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`);
    const expenseCategory = categoriesRes.body.categories.find(
      (c: { type: string }) => c.type === "EXPENSE",
    );

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 40,
        type: "EXPENSE",
        description: "Mercado semana",
        categoryId: expenseCategory.id,
      });

    const res = await request(app)
      .get("/api/transactions/summary/by-category")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.categorySpending).toContainEqual({
      group: expenseCategory.group,
      total: 40,
      categories: [
        {
          id: expenseCategory.id,
          name: expenseCategory.name,
          color: expenseCategory.color,
          icon: expenseCategory.icon,
          userId: expect.any(String),
          total: 40,
        },
      ],
    });
  });

  it("should not include income transactions in a category's spending total", async () => {
    const accessToken = await createAndAuthenticateUser();

    const categoriesRes = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`);
    const incomeCategory = categoriesRes.body.categories.find(
      (c: { type: string }) => c.type === "INCOME",
    );

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        amount: 5000,
        type: "INCOME",
        description: "Salário do mês",
        categoryId: incomeCategory.id,
      });

    const res = await request(app)
      .get("/api/transactions/summary/by-category")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.categorySpending).toEqual([]);
  });
});
