import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";
import { createAndAuthenticateUser } from "./helpers.js";

const testFamilyGroup = {
  name: "Silva",
};

const testInviteCode = {
  inviteCode: "550e8400-e29b-41d4-a716-446655440000",
};

const user2 = {
  name: "Test user2",
  email: "test2@contajunto.com",
  password: "senha1234",
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

describe("POST /groups/join", () => {
  it("should return 400 when inviteCode is missing", async () => {
    const accessToken = await createAndAuthenticateUser();
    const res = await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "OT" });

    expect(res.status).toBe(400);
  });

  it("should return 409 when user already belongs to a group", async () => {
    const accessToken = await createAndAuthenticateUser();
    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testFamilyGroup);
    const res = await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testInviteCode);

    expect(res.status).toBe(409);
  });

  it("should return 404 when inviteCode does not exist", async () => {
    const accessToken = await createAndAuthenticateUser();
    const res = await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testInviteCode);

    expect(res.status).toBe(404);
  });

  it("should return 200 and join the group successfully", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const groupRes = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(testFamilyGroup);
    const accessToken2 = await createAndAuthenticateUser(user2);
    const res = await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ inviteCode: groupRes.body.group.inviteCode });
    expect(res.status).toBe(200);
  });
});

describe("GET /groups", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/groups");

    expect(res.status).toBe(401);
  });

  it("should return 404 when FamilyGroup does not exist", async () => {
    const accessToken = await createAndAuthenticateUser();
    const res = await request(app)
      .get("/groups")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 200 and group  + users", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const groupRes = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(testFamilyGroup);
    const accessToken2 = await createAndAuthenticateUser(user2);
    await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ inviteCode: groupRes.body.group.inviteCode });
    const getGroup = await request(app)
      .get("/groups")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(getGroup.status).toBe(200);
    expect(getGroup.body).toMatchObject({
      group: {
        name: expect.any(String),
        id: expect.any(String),
        users: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            id: expect.any(String),
            email: expect.any(String),
          }),
        ]),
      },
    });
  });
});
