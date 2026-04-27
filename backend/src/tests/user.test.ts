import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

const testToken = {
  token: "asndohoiuhP2Y7E98hakjsdbKJB",
};

const testUser = {
  name: "Test User",
  email: "test@contajunto.com",
  password: "senha1234",
};

describe("GET /users/me", () => {
  it("should return token not found.", async () => {
    const res = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${testToken.token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("should return 401 when no token is provided.", async () => {
    const res = await request(app).get("/users/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should return user data with valid token", async () => {
    await request(app).post("/auth/register").send(testUser);
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    const { accessToken } = loginRes.body;
    const res = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.body.user.email).toBe(testUser.email);
  });
});
