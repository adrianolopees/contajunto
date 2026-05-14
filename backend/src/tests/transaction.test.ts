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
      .get(`/transactions?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
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
