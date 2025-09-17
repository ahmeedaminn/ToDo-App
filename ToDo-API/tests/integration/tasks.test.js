import request from "supertest";
import { app } from "../../index.js";
import mongoose from "mongoose";
import { resetDb, createTask, buildTask, setupUsers } from "../test.helpers.js";
import { Task } from "../../models/tasks.js";

let server;
let userToken, otherToken;
let userId, otherId;
let user, otherUser;
let task;

describe("Tasks /", () => {
  beforeAll(() => {
    server = app.listen();
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await resetDb();
    ({ userToken, user, userId, otherUser, otherToken, otherId } =
      await setupUsers());
    ({ task } = await createTask({ user }));
  });

  describe("GET /", () => {
    const execute = function (userToken) {
      return request(server).get("/api/tasks/").set("x-auth-token", userToken);
    };

    it("should return empty array if user has no tasks", async () => {
      await resetDb();
      const res = await execute(userToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return 401 if no token provided", async () => {
      const res = await execute("");

      expect(res.status).toBe(401);
    });

    it("should return 400 if invalid token", async () => {
      const invalidToken = "invalidToken";
      const res = await execute(invalidToken);

      expect(res.status).toBe(400);
    });

    it("should not return tasks from other user", async () => {
      const { otherUser, otherToken } = await setupUsers();
      await createTask({ user: otherUser });
      const res = await execute(userToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1); // only our task
      expect(res.body[0]).toMatchObject({ name: task.name });
    });

    it("should return 200 and user tasks", async () => {
      const res = await execute(userToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ name: task.name });
    });
  });

  describe("POST /", () => {
    const execute = function (userToken, data) {
      return request(server)
        .post("/api/tasks/")
        .set("x-auth-token", userToken)
        .send(data);
    };

    it("should return 401 if no token provided", async () => {
      const res = await execute("", buildTask());
      expect(res.status).toBe(401);
    });

    it("should return 400 if invalid token provided", async () => {
      const res = await execute("invalidToken", buildTask());
      expect(res.status).toBe(400);
    });

    it("should return 400 if name is missing", async () => {
      const { name, ...invalidTask } = buildTask();
      const res = await execute(userToken, invalidTask);
      expect(res.status).toBe(400);
    });

    it("should return 400 if name is too short", async () => {
      const res = await execute(userToken, { name: "a" });
      expect(res.status).toBe(400);
    });

    it("should return 400 if status is invalid", async () => {
      const res = await execute(userToken, {
        name: "valid name",
        status: "not-a-valid-status",
      });
      expect(res.status).toBe(400);
    });

    it("should save with default status if not provided", async () => {
      const res = await execute(userToken, { name: "valid name" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("pending");
    });

    it("should trim the name before saving", async () => {
      const res = await execute(userToken, { name: "   spaced   " });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("spaced");
    });

    it("should assign the task to the logged-in user only", async () => {
      const data = { ...buildTask() }; // userId injected
      const res = await execute(userToken, data);

      expect(res.status).toBe(200);
      expect(res.body.user.userId).toBe(user._id.toHexString());
    });
  });

  describe("PATCH id /", () => {
    const execute = function (id, userToken, data) {
      return request(server)
        .patch(`/api/tasks/${id}`)
        .set("x-auth-token", userToken)
        .send(data);
    };

    it("should return 400 if invalid id", async () => {
      const invalidId = "123";
      const res = await execute(invalidId, userToken, buildTask());
      expect(res.status).toBe(400);
    });

    it("should return 404 if id not found", async () => {
      const newId = new mongoose.Types.ObjectId();

      const res = await execute(newId, userToken, buildTask());
      expect(res.status).toBe(404);
    });

    it("should return 401 if no token provided", async () => {
      const res = await execute(task._id, "", buildTask());
      expect(res.status).toBe(401);
    });

    it("should return 400 if invalid token provided", async () => {
      const res = await execute(task._id, "invalidToken", buildTask());
      expect(res.status).toBe(400);
    });

    it("should return 400 if all fields are missing", async () => {
      const noUpdate = {};

      const res = await execute(task._id, userToken, noUpdate);
      expect(res.status).toBe(400);
    });

    it("should return 403 if user try to modify another user", async () => {
      const res = await execute(task._id, otherToken, buildTask());
      expect(res.status).toBe(403);
    });

    it("should return 400 if status is invalid", async () => {
      const res = await execute(task._id, userToken, {
        name: "valid name",
        status: "not-a-valid-status",
      });
      expect(res.status).toBe(400);
    });

    it("should save with default status if not provided", async () => {
      const res = await execute(task._id, userToken, { name: "valid name" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("pending");
    });

    it("should trim the name before saving", async () => {
      const res = await execute(task._id, userToken, { name: "   spaced   " });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("spaced");
    });

    it("should assign the task to the logged-in user only", async () => {
      const data = { ...buildTask() }; // userId injected
      const res = await execute(task._id, userToken, data);

      expect(res.status).toBe(200);
      expect(res.body.user.userId).toBe(user._id.toHexString());
    });
  });
  describe("DELETE /:id", () => {
    const execute = function (id, userToken) {
      return request(server)
        .delete(`/api/tasks/${id}`)
        .set("x-auth-token", userToken);
    };

    it("should return 401 if no token provided", async () => {
      const res = await execute(task._id, "");
      expect(res.status).toBe(401);
    });

    it("should return 400 if invalid token", async () => {
      const res = await execute(task._id, "invalidToken");
      expect(res.status).toBe(400);
    });

    it("should return 400 if invalid id", async () => {
      const invalidId = "123";
      const res = await execute(invalidId, userToken);
      expect(res.status).toBe(400);
    });

    it("should return 404 if id not found", async () => {
      const newId = new mongoose.Types.ObjectId();
      const res = await execute(newId, userToken);
      expect(res.status).toBe(404);
    });

    it("should return 403 if task belongs to another user", async () => {
      const { otherUser, otherToken } = await setupUsers();
      const { task: otherTask } = await createTask({ user: otherUser });

      const res = await execute(otherTask._id, userToken);
      expect(res.status).toBe(403);
    });

    it("should return 200 and delete the task if valid request", async () => {
      const res = await execute(task._id, userToken);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toMatchObject({
        name: task.name,
        status: task.status,
      });
    });

    it("should actually remove the task from database", async () => {
      await execute(task._id, userToken);

      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it("should not delete tasks from other users", async () => {
      const { otherUser, otherToken } = await setupUsers();
      const { task: otherTask } = await createTask({ user: otherUser });

      // Try to delete other user's task (should fail)
      await execute(otherTask._id, userToken);

      // Verify other user's task still exists
      const stillExists = await Task.findById(otherTask._id);
      expect(stillExists).not.toBeNull();
    });
  });
});
