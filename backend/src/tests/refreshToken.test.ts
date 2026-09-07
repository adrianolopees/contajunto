import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { hashToken } from "../lib/token.js";

const testUser = {
  name: "Token User",
  email: "token@contajunto.com",
  password: "senha1234",
};

beforeEach(async () => {
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await request(app).post("/api/auth/register").send(testUser);
});

afterAll(async () => {
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// o valor cru do cookie é `refreshToken=<token>; Path=/; ...`
function rawTokenFromCookie(setCookie: string[] | string): string {
  const header = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return header.split(";")[0].split("=")[1];
}

async function login() {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: testUser.email, password: testUser.password });
  const cookie = res.headers["set-cookie"];
  return { cookie, raw: rawTokenFromCookie(cookie) };
}

describe("refresh token storage", () => {
  it("should store only the hash of the token, never the raw value", async () => {
    const { raw } = await login();

    const rows = await prisma.refreshToken.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].token).not.toBe(raw);
    expect(rows[0].token).toBe(hashToken(raw));
  });

  it("should refresh with the raw cookie and rotate the stored hash", async () => {
    const { cookie, raw } = await login();

    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);

    expect(res.status).toBe(200);
    const rows = await prisma.refreshToken.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].token).not.toBe(hashToken(raw));
    expect(rows[0].token).toBe(hashToken(rawTokenFromCookie(res.headers["set-cookie"])));
  });

  it("should reject a cookie carrying the stored hash instead of the raw token", async () => {
    await login();
    const [row] = await prisma.refreshToken.findMany();

    // quem vazou o banco tem só o hash — ele não pode virar sessão
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${row.token}`);

    expect(res.status).toBe(401);
  });

  it("should delete the hashed row on logout", async () => {
    const { cookie } = await login();

    const res = await request(app).post("/api/auth/logout").set("Cookie", cookie);

    expect(res.status).toBe(204);
    expect(await prisma.refreshToken.count()).toBe(0);
  });
});
