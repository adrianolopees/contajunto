import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { createAndAuthenticateUser } from "./helpers.js";

const testFamilyGroup = {
  name: "Silva",
};

beforeEach(async () => {
  await prisma.familyGroup.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.familyGroup.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /groups", () => {
  it("should create a family group and return 201", async () => {
    const accessToken = await createAndAuthenticateUser();
    const res = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testFamilyGroup);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      group: {
        id: expect.any(String),
        name: expect.any(String),
        inviteCode: expect.any(String),
      },
    });
  });

  it("should return 409 when user already belongs to a group", async () => {
    const accessToken = await createAndAuthenticateUser();
    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testFamilyGroup);
    const res = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testFamilyGroup);

    expect(res.status).toBe(409);
  });

  it("should return 400 when name is invalid", async () => {
    const accessToken = await createAndAuthenticateUser();
    const res = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "AB" });

    expect(res.status).toBe(400);
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app).post("/groups").send(testFamilyGroup);

    expect(res.status).toBe(401);
  });
});
