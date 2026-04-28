import request from "supertest";
import app from "../app.js";

const defaultUser = {
  name: "Test User",
  email: "test@contajunto.com",
  password: "senha1234",
};

export async function createAndAuthenticateUser() {
  await request(app).post("/auth/register").send(defaultUser);
  const res = await request(app)
    .post("/auth/login")
    .send({ email: defaultUser.email, password: defaultUser.password });
  return res.body.accessToken as string;
}
