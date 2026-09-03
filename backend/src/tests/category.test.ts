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
    const res = await request(app).get("/api/categories/default");

    expect(res.status).toBe(200);
    expect(res.body.categoriesDefault).toBeInstanceOf(Array);
    expect(res.body.categoriesDefault.length).toBeGreaterThan(0);
  });

  it("should return default categories with expected fields, including group", async () => {
    const res = await request(app).get("/api/categories/default");

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
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(401);
  });

  it("should return 401 token invalid", async () => {
    const res = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer abc`);

    expect(res.status).toBe(401);
  });

  it("should return 200, authenticated user with categories copied at registration", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
    expect(res.body.categories[0]).toHaveProperty("group");
  });
});
