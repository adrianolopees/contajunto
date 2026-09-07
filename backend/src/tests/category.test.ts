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
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(401);
  });

  it("should return 401 token invalid", async () => {
    const res = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer abc`);

    expect(res.status).toBe(401);
  });

  it("should return the full seeded catalog copied at registration, with group", async () => {
    // o pretest semeia o catálogo real no banco de teste — sem ele isto
    // passaria vazio (0 === 0)
    const totalDefaults = await prisma.defaultCategory.count();
    expect(totalDefaults).toBeGreaterThan(0);

    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(totalDefaults);
    expect(res.body.categories[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      color: expect.any(String),
      icon: expect.any(String),
      group: expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    });
    expect(res.body.categories[0]).not.toHaveProperty("userId");
  });

  it("should not expose a public default-categories endpoint", async () => {
    // rota removida: só um teste a consumia e o catálogo não precisa ficar
    // exposto sem auth. Sem rota, o Express devolve 404.
    const res = await request(app).get("/api/categories/default");
    expect(res.status).toBe(404);
  });
});
