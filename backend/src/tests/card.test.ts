import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { createAndAuthenticateUser } from "./helpers.js";

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

const validCard = {
  name: "Nubank",
  closingDay: 3,
  dueDay: 10,
  color: "#8b5cf6",
};

const otherUser = {
  name: "Outro",
  email: "outro@contajunto.com",
  password: "senha1234",
};

describe("GET /cards", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/cards");
    expect(res.status).toBe(401);
  });

  it("should return 200 and an empty array for a new user", async () => {
    const token = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cards).toEqual([]);
  });
});

describe("POST /cards", () => {
  it("should return 201 and the created card without userId", async () => {
    const token = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send(validCard);

    expect(res.status).toBe(201);
    expect(res.body.card).toMatchObject({
      id: expect.any(String),
      name: "Nubank",
      closingDay: 3,
      dueDay: 10,
    });
    expect(res.body.card).not.toHaveProperty("userId");
  });

  it("should return 400 when closingDay is out of range", async () => {
    const token = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validCard, closingDay: 32 });

    expect(res.status).toBe(400);
  });

  it("should return 400 when name is too short", async () => {
    const token = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validCard, name: "N" });

    expect(res.status).toBe(400);
  });

  it("should return 409 when the card limit is reached", async () => {
    const token = await createAndAuthenticateUser();

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validCard, name: `Card ${i}` });
    }

    const res = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validCard, name: "Sixth" });

    expect(res.status).toBe(409);
  });
});

describe("PATCH /cards/:id", () => {
  it("should return 200 and update the card", async () => {
    const token = await createAndAuthenticateUser();
    const created = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send(validCard);

    const res = await request(app)
      .patch(`/api/cards/${created.body.card.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nubank Ultravioleta", dueDay: 15 });

    expect(res.status).toBe(200);
    expect(res.body.card.name).toBe("Nubank Ultravioleta");
    expect(res.body.card.dueDay).toBe(15);
  });

  it("should return 400 when the id is not a valid uuid", async () => {
    const token = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/cards/abc")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X" });

    expect(res.status).toBe(400);
  });

  it("should return 404 when the card belongs to another user", async () => {
    const token1 = await createAndAuthenticateUser();
    const token2 = await createAndAuthenticateUser(otherUser);

    const created = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token1}`)
      .send(validCard);

    const res = await request(app)
      .patch(`/api/cards/${created.body.card.id}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ name: "Roubado" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /cards/:id", () => {
  it("should return 200 and delete the card", async () => {
    const token = await createAndAuthenticateUser();
    const created = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send(validCard);

    const res = await request(app)
      .delete(`/api/cards/${created.body.card.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("should return 404 when the card belongs to another user", async () => {
    const token1 = await createAndAuthenticateUser();
    const token2 = await createAndAuthenticateUser(otherUser);

    const created = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token1}`)
      .send(validCard);

    const res = await request(app)
      .delete(`/api/cards/${created.body.card.id}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });

  it("should null the cardId of linked transactions instead of deleting them", async () => {
    const token = await createAndAuthenticateUser();
    const created = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send(validCard);
    const cardId = created.body.card.id;

    const tx = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 99.9,
        type: "EXPENSE",
        description: "Tênis",
        paymentMethod: "CREDIT",
        cardId,
      });

    await request(app)
      .delete(`/api/cards/${cardId}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/transactions/${tx.body.transaction.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.transaction.cardId).toBeNull();
  });
});
