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

const user3 = {
  name: "Test user3",
  email: "test3@contajunto.com",
  password: "senha1234",
};

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.familyGroup.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
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
      .send({ name: "A" });

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

  it("should regenerate inviteCode after join", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const groupRes = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(testFamilyGroup);
    const originalInviteCode = groupRes.body.group.inviteCode;

    const accessToken2 = await createAndAuthenticateUser(user2);
    await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ inviteCode: originalInviteCode });

    const inviteRes = await request(app)
      .get("/groups/invite")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(inviteRes.status).toBe(200);
    expect(inviteRes.body.inviteCode).not.toBe(originalInviteCode);
  });

  it("should return 409 when group is already full", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const groupRes = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(testFamilyGroup);
    const originalInviteCode = groupRes.body.group.inviteCode;

    const accessToken2 = await createAndAuthenticateUser(user2);
    await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ inviteCode: originalInviteCode });

    const inviteRes = await request(app)
      .get("/groups/invite")
      .set("Authorization", `Bearer ${accessToken1}`);
    const newInviteCode = inviteRes.body.inviteCode;

    const accessToken3 = await createAndAuthenticateUser(user3);
    const res = await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken3}`)
      .send({ inviteCode: newInviteCode });

    expect(res.status).toBe(409);
  });
});

describe("GET /groups/invite", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/groups/invite");

    expect(res.status).toBe(401);
  });

  it("should return 404 when user has no group", async () => {
    const accessToken = await createAndAuthenticateUser();
    const res = await request(app)
      .get("/groups/invite")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 200 with inviteCode", async () => {
    const accessToken = await createAndAuthenticateUser();
    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testFamilyGroup);

    const res = await request(app)
      .get("/groups/invite")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      inviteCode: expect.any(String),
    });
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

const validTransaction = {
  amount: 49.9,
  type: "EXPENSE",
  description: "Mercado Extra",
};

async function createGroupWithTwoMembers() {
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

  return { accessToken1, accessToken2 };
}

describe("GET /groups/transactions", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/groups/transactions");

    expect(res.status).toBe(401);
  });

  it("should return 404 when user has no group", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .get("/groups/transactions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 200 and empty array when group has no transactions", async () => {
    const { accessToken1 } = await createGroupWithTwoMembers();

    const res = await request(app)
      .get("/groups/transactions")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });

  it("should return transactions from both group members", async () => {
    const { accessToken1, accessToken2 } = await createGroupWithTwoMembers();

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ ...validTransaction, description: "Conta de luz" });

    const res = await request(app)
      .get("/groups/transactions")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(2);
  });

  it("should not return transactions from users outside the group", async () => {
    const { accessToken1 } = await createGroupWithTwoMembers();
    const outsiderToken = await createAndAuthenticateUser(user3);

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/groups/transactions")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });

  it("should filter transactions by month and year", async () => {
    const { accessToken1 } = await createGroupWithTwoMembers();

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const now = new Date();
    const res = await request(app)
      .get(
        `/groups/transactions?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      )
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
  });

  it("should return empty array when filter does not match", async () => {
    const { accessToken1 } = await createGroupWithTwoMembers();

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/groups/transactions?month=1&year=2000")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });

  it("should return pagination metadata", async () => {
    const { accessToken1 } = await createGroupWithTwoMembers();

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/groups/transactions")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total: 1,
      page: 1,
      totalPages: 1,
    });
  });

  it("should paginate across group members transactions", async () => {
    const { accessToken1, accessToken2 } = await createGroupWithTwoMembers();

    await Promise.all([
      request(app)
        .post("/transactions")
        .set("Authorization", `Bearer ${accessToken1}`)
        .send({ ...validTransaction, description: "Transacao 1" }),
      request(app)
        .post("/transactions")
        .set("Authorization", `Bearer ${accessToken2}`)
        .send({ ...validTransaction, description: "Transacao 2" }),
      request(app)
        .post("/transactions")
        .set("Authorization", `Bearer ${accessToken1}`)
        .send({ ...validTransaction, description: "Transacao 3" }),
    ]);

    const page1 = await request(app)
      .get("/groups/transactions?limit=2&page=1")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(page1.status).toBe(200);
    expect(page1.body.transactions).toHaveLength(2);
    expect(page1.body).toMatchObject({ total: 3, page: 1, totalPages: 2 });

    const page2 = await request(app)
      .get("/groups/transactions?limit=2&page=2")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(page2.status).toBe(200);
    expect(page2.body.transactions).toHaveLength(1);
    expect(page2.body).toMatchObject({ total: 3, page: 2, totalPages: 2 });
  });

  it("should include category in transaction response", async () => {
    const { accessToken1 } = await createGroupWithTwoMembers();

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(validTransaction);

    const res = await request(app)
      .get("/groups/transactions")
      .set("Authorization", `Bearer ${accessToken1}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions[0]).toHaveProperty("category");
  });
});

describe("DELETE /groups/leave", () => {
  it("should return 404 when user is not group", async () => {
    const accessToken = await createAndAuthenticateUser();

    const res = await request(app)
      .delete("/groups/leave")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 200 1 user group delet", async () => {
    const accessToken = await createAndAuthenticateUser();

    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testFamilyGroup);

    await request(app)
      .delete("/groups/leave")
      .set("Authorization", `Bearer ${accessToken}`);

    const res = await request(app)
      .get("/groups")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 200 and group remains with 2 users", async () => {
    const accessToken1 = await createAndAuthenticateUser();
    const accessToken2 = await createAndAuthenticateUser(user2);

    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${accessToken1}`)
      .send(testFamilyGroup);

    const inviteRes = await request(app)
      .get("/groups/invite")
      .set("Authorization", `Bearer ${accessToken1}`);

    await request(app)
      .post("/groups/join")
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ inviteCode: inviteRes.body.inviteCode });

    await request(app)
      .delete("/groups/leave")
      .set("Authorization", `Bearer ${accessToken1}`);

    const res = await request(app)
      .get("/groups")
      .set("Authorization", `Bearer ${accessToken2}`);

    expect(res.status).toBe(200);
  });
});
