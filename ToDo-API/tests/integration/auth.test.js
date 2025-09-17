import request from "supertest";
import { User } from "../../models/users.js";
import { app } from "../../index.js";
import { resetDb, setupUsers, buildUser } from "../test.helpers.js";
import mongoose from "mongoose";

describe("auth route /", () => {
  let server;
  let user;
  let plainPass;

  beforeAll(() => {
    server = app.listen();
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await resetDb();
    const users = await setupUsers();
    ({
      user,
      adminUser,
      otherUser,
      userId,
      otherId,
      adminId,
      userToken,
      adminToken,
      otherToken,
      plainPass,
    } = users);
  });

  const execute = function (userData = {}) {
    return request(server).post("/api/auth").send(userData);
  };

  it("should return 400 Missing password", async () => {
    const userData = buildUser({ password: "" });

    const res = await execute(userData);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it("should return 400 Missing username/email", async () => {
    const userData = buildUser({});

    const res = await execute(userData);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
    expect(res.body.error).toMatch(/username/i);
  });

  it("should return 401 if invalid username", async () => {
    const userData = {
      email: "wrong@email.com",
      password: "anyPassword123",
    };

    const res = await execute(userData);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("should return 401 if invalid username", async () => {
    const userData = {
      userName: "nonexistUser",
      password: "anyPassword123",
    };

    const res = await execute(userData);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("should return 401 if invalid password with correct username", async () => {
    const userData = {
      userName: user.userName,
      password: "wrongpassword123",
    };

    const res = await execute(userData);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("should return 401 if invalid password with correct email", async () => {
    const userData = {
      email: user.email,
      password: "wrongpassword123",
    };

    const res = await execute(userData);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("should send token if user data is correct", async () => {
    const userData = {
      userName: user.userName,
      password: plainPass,
    };

    const res = await execute(userData);

    expect(res.status).toBe(200);
    expect(res.header).toHaveProperty("x-auth-token");
    expect(res.body).toBeDefined();
  });
});
