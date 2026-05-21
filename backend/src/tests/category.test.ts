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

  it("should return 200, Authenticated user without categories", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });

  it("should return 200 but now authenticated user with categories", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Prazeres", color: "blue", icon: "qualQuerUm" });

    const res2 = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.categories.length).toBeGreaterThan(0);
  });
});

describe("POST /categories", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app)
      .post("/categories")
      .send({ name: "Viagem", color: "green", icon: "plane" });

    expect(res.status).toBe(401);
  });

  it("should return 400 when body is invalid", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "V", color: "green" });

    expect(res.status).toBe(400);
  });

  it("should return 201 and create category", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Viagem", color: "green", icon: "plane" });

    expect(res.status).toBe(201);
    expect(res.body.newCategory).toMatchObject({
      name: "Viagem",
      color: "green",
      icon: "plane",
    });
    expect(res.body.newCategory.userId).toBeUndefined();
  });

  it("should return 409 when category already exists for the user", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Viagem", color: "green", icon: "plane" });

    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Viagem", color: "blue", icon: "plane" });

    expect(res.status).toBe(409);
  });
  it("should return 409 when category name already exists as default", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Saúde", color: "blue", icon: "plane" });

    expect(res.status).toBe(409);
  });

  it("should allow two users to have a category with the same name", async () => {
    const token1 = await createAndAuthenticateUser();
    const token2 = await createAndAuthenticateUser({
      name: "Outro",
      email: "outro@email.com",
      password: "senha1234",
    });

    const res1 = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token1}`)
      .send({ name: "Viagem", color: "green", icon: "plane" });

    const res2 = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token2}`)
      .send({ name: "Viagem", color: "blue", icon: "plane" });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
  });
});
