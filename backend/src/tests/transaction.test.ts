import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { createAndAuthenticateUser } from "./helpers.js";

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

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
    const res = await request(app).post("/transactions").send(validTransaction);

    expect(res.status).toBe(401);
  });

  it("should return 400 when body is invalid", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: -10, type: "INVALID", description: "ok" });

    expect(res.status).toBe(400);
  });

  it("should return 201 and create transaction successfully", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/transactions")
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
});

describe("GET /transactions", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/transactions");

    expect(res.status).toBe(401);
  });

  it("should return 200 and empty array when user has no transactions", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/transactions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });

  it("should return 200 and list all transactions", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/transactions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
  });

  it("should filter transactions by month and year", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const now = new Date();
    const res = await request(app)
      .get(
        `/transactions?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      )
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
  });

  it("should return empty array when filter does not match", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/transactions?month=1&year=2000")
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
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/transactions")
      .set("Authorization", `Bearer ${accessToken2}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });
});

describe("PATCH /transactions/:id", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app)
      .patch("/transactions/550e8400-e29b-41d4-a716-446655440000")
      .send({ description: "Updated" });

    expect(res.status).toBe(401);
  });

  it("should return 400 when params is not a valid UUID", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/transactions/abc")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ description: "Updated" });

    expect(res.status).toBe(400);
  });

  it("should return 400 when body has invalid fields", async () => {
    const accessToken = await createAndAuthenticateUser();

    const createRes = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: -50, type: "INVALID" });

    expect(res.status).toBe(400);
  });

  it("should return 404 when transaction does not exist", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/transactions/550e8400-e29b-41d4-a716-446655440000")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ description: "Updated" });

    expect(res.status).toBe(404);
  });

  it("should return 404 when transaction belongs to another user", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser(user2);

    const createRes = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ description: "Trying to update" });

    expect(res.status).toBe(404);
  });

  it("should return 403 when categoryId does not belong to the user", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser({
      name: "Outro",
      email: "outro@email.com",
      password: "senha1234",
    });

    const categoryRes = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ name: "Viagem", color: "green", icon: "plane" });

    const transactionRes = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/transactions/${transactionRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken1}`)
      .send({ categoryId: categoryRes.body.newCategory.id });

    expect(res.status).toBe(403);
  });

  it("should return 200 and update transaction fields successfully", async () => {
    const accessToken = await createAndAuthenticateUser();

    const createRes = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ description: "Mercado Novo", amount: 99.9 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      updatedTransaction: {
        id: createRes.body.transaction.id,
        description: "Mercado Novo",
        amount: "99.9",
      },
    });
  });

  it("should return 200 when only one field is updated (partial update)", async () => {
    const accessToken = await createAndAuthenticateUser();

    const createRes = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res = await request(app)
      .patch(`/transactions/${createRes.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ type: "INCOME" });

    expect(res.status).toBe(200);
    expect(res.body.updatedTransaction.type).toBe("INCOME");
    expect(res.body.updatedTransaction.description).toBe(
      validTransaction.description,
    );
  });
});

describe("GET /transactions/:id", () => {
  it("should return 400 when params is not UUID valid", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/transactions/abc")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
  });

  it("should return 404 transaction not found", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/transactions/550e8400-e29b-41d4-a716-446655440000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 404 transaction not found", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser(user2);

    const res1 = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res2 = await request(app)
      .get(`/transactions/${res1.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken2}`);

    expect(res2.status).toBe(404);
  });

  it("should return 200 Transaction successfully completed.", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res2 = await request(app)
      .get(`/transactions/${res.body.transaction.id}`)
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
      .delete("/transactions/abc")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
  });

  it("should return 404 transaction not found", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .delete("/transactions/550e8400-e29b-41d4-a716-446655440000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 404 when transaction belongs to another user", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser(user2);

    const res1 = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res2 = await request(app)
      .delete(`/transactions/${res1.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken2}`);

    expect(res2.status).toBe(404);
  });

  it("should return 200 transaction deleted with succefull", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res1 = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validTransaction);

    const res2 = await request(app)
      .delete(`/transactions/${res1.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
  });
});
