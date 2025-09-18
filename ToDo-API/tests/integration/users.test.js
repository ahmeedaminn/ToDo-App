import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../index.js";
import { User } from "../../models/users.js";
import { resetDb, setupUsers, buildUser } from "../test.helpers.js";

describe("/api/users", () => {
  let server;
  let user, adminUser, otherUser;
  let userId, otherId, adminId;
  let userToken, adminToken;

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
    } = users);
  });

  // GET ALL
  describe("GET ALL", () => {
    const execute = async (token) => {
      return request(server).get(`/api/users/`).set("x-auth-token", token);
    };

    it("should return all users if admin", async () => {
      const res = await execute(adminToken);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      const usernames = res.body.map((u) => u.username);
      expect(usernames).toContain(user.username);
      expect(usernames).toContain(adminUser.username);
      expect(usernames).toContain(otherUser.username);
    });
  });

  // GET id
  describe("GET id/", () => {
    const execute = async (id, token) => {
      return request(server).get(`/api/users/${id}`).set("x-auth-token", token);
    };

    it("should return 400 if id invalid", async () => {
      const invalId = "123";

      const res = await execute(invalId, userToken);
      expect(res.status).toBe(400);
    });

    it("should return 404 if id is not found", async () => {
      const nonExistId = new mongoose.Types.ObjectId();

      const res = await execute(nonExistId, userToken);
      expect(res.status).toBe(404);
    });

    it("should return 200 if the user with given id exist", async () => {
      const res = await execute(userId, userToken);
      expect(res.status).toBe(200);
    });

    it("should return the user with given id", async () => {
      const res = await execute(userId, userToken);
      expect(res.body).toHaveProperty("username", user.username);
    });
  });

  // POST
  describe("POST /", () => {
    const execute = async ({ username, password, email }) => {
      return request(server)
        .post(`/api/users/`)
        .send({ username, password, email });
    };

    it("should return 400 if email is used", async () => {
      const newUser = buildUser({ email: user.email });

      const res = await execute(newUser);
      expect(res.status).toBe(400);
    });

    it("should return 400 if username is used", async () => {
      const newUser = buildUser({ username: user.username });

      const res = await execute(newUser);
      expect(res.status).toBe(400);
    });

    it("should create a new user", async () => {
      const newUser = buildUser();

      const res = await execute(newUser);
      expect(res.status).toBe(200);
      expect(res.header).toHaveProperty("x-auth-token");
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("username", newUser.username);
    });
  });

  // PUT
  describe("PUT id/", () => {
    const execute = async (id, token, { username, password, email }) => {
      return request(server)
        .patch(`/api/users/${id}`)
        .set("x-auth-token", token)
        .send({ username, password, email });
    };

    it("should return 404 if id not found", async () => {
      const nonExistId = new mongoose.Types.ObjectId();
      const updatedUser = buildUser();

      const res = await execute(nonExistId, userToken, updatedUser);
      expect(res.status).toBe(404);
    });

    it("should return 400 if invalid id", async () => {
      const invalidId = "123";
      const updatedUser = buildUser();

      const res = await execute(invalidId, userToken, updatedUser);
      expect(res.status).toBe(400);
    });

    it("should return 400 if no updated fields", async () => {
      const updatedUser = {};

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
    });

    it("should return 400 if email already exist in other user", async () => {
      const otherUser = new User(buildUser());
      await otherUser.save();

      const updatedUser = buildUser({ email: otherUser.email });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
    });

    it("should return 400 if username already exist in other user", async () => {
      const otherUser = new User(buildUser());
      await otherUser.save();

      const updatedUser = buildUser({
        username: otherUser.username,
      });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
    });

    it("should return 400 if username is less than 3", async () => {
      const updatedUser = buildUser({
        username: "a",
      });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/username/i);
    });

    it("should return 400 if username is more than 50", async () => {
      const updatedUser = buildUser({
        username: new Array(52).join("a"),
      });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/username/i);
    });

    it("should return 400 if password is less than 8", async () => {
      const updatedUser = buildUser({
        password: "a",
      });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/i);
    });

    it("should return 400 if password is more than 50", async () => {
      const updatedUser = buildUser({
        password: new Array(52).join("a"),
      });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/i);
    });

    it("should return 400 if email is less than 4", async () => {
      const updatedUser = buildUser({
        email: "a@b",
      });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it("should return 400 if email is more than 50", async () => {
      const updatedUser = buildUser({
        email: "a".repeat(44) + "@aa.com",
      });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it("should allow keeping same email and username", async () => {
      const updatedUser = buildUser({
        username: user.username,
        email: user.email,
      });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.status).toBe(200);
    });

    it("should update user", async () => {
      const updatedUser = buildUser({ username: "newName" });

      const res = await execute(userId, userToken, updatedUser);
      expect(res.body).toHaveProperty("username", updatedUser.username);
    });
  });

  describe("DELETE id/", () => {
    //
    const execute = async function (id, token) {
      return request(server)
        .delete(`/api/users/${id}`)
        .set("x-auth-token", token);
    };

    it("should return 400 if id invalid", async () => {
      const invalId = "123";

      const res = await execute(invalId, userToken);
      expect(res.status).toBe(400);
    });

    it("should return 404 if id not found", async () => {
      const nonExistId = new mongoose.Types.ObjectId();

      const res = await execute(nonExistId, userToken);
      expect(res.status).toBe(404);
    });
  });
});
