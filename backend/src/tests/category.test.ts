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

describe("GET /categories/default", () => {
  it("should return 200 with default categories without auth", async () => {
    const res = await request(app).get("/categories/default");

    expect(res.status).toBe(200);
    expect(res.body.categoriesDefault).toBeInstanceOf(Array);
    expect(res.body.categoriesDefault.length).toBeGreaterThan(0);
  });

  it("should return default categories with expected fields, including group", async () => {
    const res = await request(app).get("/categories/default");

    expect(res.status).toBe(200);
    expect(res.body.categoriesDefault[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      color: expect.any(String),
      icon: expect.any(String),
      group: expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    });
  });
});

describe("GET /categories", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/categories");
    expect(res.status).toBe(401);
  });

  it("should return 401 token invalid", async () => {
    const res = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer abc`);

    expect(res.status).toBe(401);
  });

  it("should return 200, authenticated user with categories copied at registration", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
    expect(res.body.categories[0]).toHaveProperty("group");
  });
});

describe("PATCH /categories", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app)
      .patch("/categories/550e8400-e29b-41d4-a716-446655440000")
      .send({ monthlyLimit: 100 });

    expect(res.status).toBe(401);
  });

  it("should return 400 when params is not a valid UUID", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/categories/abc")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyLimit: 100 });

    expect(res.status).toBe(400);
  });

  it("should return 404 when category does not exist", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/categories/550e8400-e29b-41d4-a716-446655440000")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyLimit: 100 });

    expect(res.status).toBe(404);
  });

  it("should return 200 and update monthlyLimit", async () => {
    const accessToken = await createAndAuthenticateUser();

    const owned = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${accessToken}`);
    const category = owned.body.categories[0];

    const res = await request(app)
      .patch(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyLimit: 300 });

    expect(res.status).toBe(200);
    expect(res.body.category.monthlyLimit).toBe("300");
    expect(res.body.category.name).toBe(category.name);
  });

  it("should clear monthlyLimit when sent as null", async () => {
    const accessToken = await createAndAuthenticateUser();

    const owned = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${accessToken}`);
    const category = owned.body.categories[0];

    await request(app)
      .patch(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyLimit: 300 });

    const res = await request(app)
      .patch(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyLimit: null });

    expect(res.status).toBe(200);
    expect(res.body.category.monthlyLimit).toBeNull();
  });

  it("should return 404 when category belongs to another user", async () => {
    const token1 = await createAndAuthenticateUser();
    const token2 = await createAndAuthenticateUser({
      name: "Outro",
      email: "outro@email.com",
      password: "senha1234",
    });

    const owned = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${token1}`);
    const category = owned.body.categories[0];

    const res = await request(app)
      .patch(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ monthlyLimit: 100 });

    expect(res.status).toBe(404);
  });
});
