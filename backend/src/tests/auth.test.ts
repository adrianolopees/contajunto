import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";

const testUser = {
  name: "Test User",
  email: "test@contajunto.com",
  password: "senha1234",
};

beforeEach(async () => {
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("should register a new user and return 201", async () => {
    const res = await request(app).post("/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      user: {
        name: testUser.name,
        email: testUser.email,
      },
    });
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("should return 409 when email is already in use", async () => {
    await request(app).post("/auth/register").send(testUser);
    const res = await request(app).post("/auth/register").send(testUser);

    expect(res.status).toBe(409);
  });

  it("should return 400 when body is invalid", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "invalido" });

    expect(res.status).toBe(400);
  });

  it("should register without categories when defaultCategoryIds is omitted", async () => {
    const res = await request(app).post("/auth/register").send(testUser);

    expect(res.status).toBe(201);

    const categories = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password })
      .then((loginRes) =>
        request(app)
          .get("/categories")
          .set("Authorization", `Bearer ${loginRes.body.accessToken}`),
      );

    expect(categories.body.categories).toHaveLength(0);
  });

  it("should register and copy only selected default categories", async () => {
    const defaultsRes = await request(app).get("/categories/default");
    const firstTwo = defaultsRes.body.categoriesDefault
      .slice(0, 2)
      .map((c: { id: string }) => c.id);

    const res = await request(app)
      .post("/auth/register")
      .send({ ...testUser, defaultCategoryIds: firstTwo });

    expect(res.status).toBe(201);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    const categories = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(categories.body.categories).toHaveLength(2);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/register").send(testUser);
  });

  it("should login and return accessToken with refreshToken cookie", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("should return 401 with wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: "senhaerrada" });

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/refresh", () => {
  it("should return a new accessToken when refreshToken cookie is valid", async () => {
    await request(app).post("/auth/register").send(testUser);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    const cookie = loginRes.headers["set-cookie"];

    const res = await request(app).post("/auth/refresh").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("should return 401 when no cookie is sent", async () => {
    const res = await request(app).post("/auth/refresh");

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("should return 204 and clear the cookie", async () => {
    await request(app).post("/auth/register").send(testUser);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    const cookie = loginRes.headers["set-cookie"];

    const res = await request(app).post("/auth/logout").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });

  it("should return 204 even without a cookie", async () => {
    const res = await request(app).post("/auth/logout");

    expect(res.status).toBe(204);
  });
});
