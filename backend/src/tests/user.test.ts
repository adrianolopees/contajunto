import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { createAndAuthenticateUser } from "./helpers.js";

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

const testToken = {
  token: "asndohoiuhP2Y7E98hakjsdbKJB",
};

describe("GET /users/me", () => {
  it("should return token not found.", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${testToken.token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("should return 401 when no token is provided.", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should return user data with valid token", async () => {
    const accessToken = await createAndAuthenticateUser();
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.body.user.email).toBe("test@contajunto.com");
  });

  it("should return monthlyBudget as null for a new user", async () => {
    const accessToken = await createAndAuthenticateUser();
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.monthlyBudget).toBeNull();
  });
});

describe("PATCH /users/me", () => {
  it("should return 401 when token is invalid", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${testToken.token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should return 400 when name is invalid", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "A" });

    expect(res.status).toBe(400);
  });

  it("should return 200 and update name", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Nome Atualizado" });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Nome Atualizado");
  });

  it("should not expose passwordHash in response", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Nome Atualizado" });

    expect(res.status).toBe(200);
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("should set the monthly budget", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyBudget: 4000 });

    expect(res.status).toBe(200);
    expect(res.body.user.monthlyBudget).toBe("4000");
  });

  it("should clear the monthly budget when sent as null", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyBudget: 4000 });

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyBudget: null });

    expect(res.status).toBe(200);
    expect(res.body.user.monthlyBudget).toBeNull();
  });

  it("should return 400 when monthlyBudget is not positive", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyBudget: -10 });

    expect(res.status).toBe(400);
  });

  it("should update name and monthlyBudget together", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Ana Budget", monthlyBudget: 2500 });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Ana Budget");
    expect(res.body.user.monthlyBudget).toBe("2500");
  });
});
