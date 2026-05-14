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
