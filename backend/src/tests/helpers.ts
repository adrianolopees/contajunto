import request from "supertest";
import app from "../app.js";

const defaultUser = {
  name: "Test User",
  email: "test@contajunto.com",
  password: "senha1234",
};

export async function createAndAuthenticateUser(user = defaultUser) {
  await request(app).post("/auth/register").send(user);
  const res = await request(app)
    .post("/auth/login")
    .send({ email: user.email, password: user.password });
  return res.body.accessToken as string;
}
