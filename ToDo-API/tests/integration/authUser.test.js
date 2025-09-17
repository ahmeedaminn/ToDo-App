import request from "supertest";
import { User } from "../../models/users.js";
import { app } from "../../index.js";
import { resetDb, setupUsers, buildUser } from "../test.helpers.js";
import mongoose from "mongoose";

describe("user auth /", () => {
  let server;
  let user, adminUser, otherUser;
  let userId, otherId, adminId;
  let userToken, adminToken, otherToken;

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
    } = users);
  });

  describe("User", () => {
    // GET all
    describe("GET All/", () => {
      //
      const execute = async (token) => {
        return request(server).get(`/api/users/`).set("x-auth-token", token);
      };

      it("should return 403 if user is not admin", async () => {
        const res = await execute(userToken);
        expect(res.status).toBe(403);
      });

      it("should return 200 if user is admin", async () => {
        const res = await execute(adminToken);
        expect(res.status).toBe(200);
      });
    });

    // GET id
    describe("GET id/", () => {
      const execute = async (id, token) => {
        return request(server)
          .get(`/api/users/${id}`)
          .set("x-auth-token", token);
      };

      it("should return 401 if no token", async () => {
        const res = await execute(userId, "");
        expect(res.status).toBe(401);
      });

      it("should return 400 if token invalid", async () => {
        const invalidToken = "invalid token";
        const res = await execute(userId, invalidToken);
        expect(res.status).toBe(400);
      });

      it("should forbid non-admin access to another user", async () => {
        const res = await execute(otherId, userToken);
        expect(res.status).toBe(403);
      });

      it("should allow admin access to another user", async () => {
        const res = await execute(otherId, adminToken);
        expect(res.status).toBe(200);
      });

      it("should allow self-access", async () => {
        const res = await execute(userId, userToken);
        expect(res.status).toBe(200);
      });
    });

    // PATCH
    describe("PATCH /", () => {
      //
      const execute = async (id, token, { userName, password, email }) => {
        return request(server)
          .patch(`/api/users/${id}`)
          .set("x-auth-token", token)
          .send({ userName, password, email });
      };

      it("should return 400 if invalid token", async () => {
        const userData = buildUser();
        const invalidToken = "invalid token";

        const res = await execute(userId, invalidToken, userData);
        expect(res.status).toBe(400);
      });

      it("should return 401 if no token", async () => {
        const userData = buildUser();

        const res = await execute(userId, "", userData);
        expect(res.status).toBe(401);
      });

      it("should return 403 if not same user", async () => {
        const userData = buildUser();

        const res = await execute(userId, otherToken, userData);
        expect(res.status).toBe(403);
      });

      it("should allow self-access", async () => {
        const userData = buildUser();
        const res = await execute(userId, userToken, userData);
        expect(res.status).toBe(200);
      });
    });

    // DELETE
    describe("DELETE id/", () => {
      //
      const execute = async (id, token) => {
        return request(server)
          .delete(`/api/users/${id}`)
          .set("x-auth-token", token);
      };

      it("should return 400 if invalid token", async () => {
        const invalidToken = "invalid token";

        const res = await execute(userId, invalidToken);
        expect(res.status).toBe(400);
      });

      it("should return 400 if no token", async () => {
        const res = await execute(userId, "");
        expect(res.status).toBe(401);
      });

      it("should return 403 if user is neither admin nor same user", async () => {
        const res = await execute(userId, otherToken);
        expect(res.status).toBe(403);
      });

      it("should delete if user is admin", async () => {
        const res = await execute(userId, adminToken);
        expect(res.status).toBe(200);

        const userInDb = await User.findById(userId);
        expect(userInDb).toBeNull();
      });

      it("should delete user if same user", async () => {
        const res = await execute(userId, userToken);
        expect(res.status).toBe(200);

        const userInDb = await User.findById(userId);
        expect(userInDb).toBeNull();
      });
    });
  });
});
