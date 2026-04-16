import express from "express";
import mongoose from "mongoose";
import { tasksValidate, Task, tasksUpdateValidate } from "../models/tasks.js";
import { User } from "../models/users.js";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import dayjs from "dayjs";
import { exist } from "../middleware/exist.js";
import { authorizeTaskOwner } from "../middleware/authorizeTaskOwner.js";
import { idValidator } from "../middleware/idValidator.js";

const router = express.Router();

// get all tasks for the authenticated user
router.get("/", auth, async (req, res) => {
  const tasks = await Task.find({ "user.userId": req.user._id });
  res.send(tasks);
});

// create a new task
router.post("/", [auth, validate(tasksValidate)], async (req, res) => {
  const { name, status, dueDate } = req.body;

  const task = new Task({
    name,
    status,
    user: {
      userId: req.user._id,
      username: req.user.username,
    },
    dueDate: dueDate ? dayjs(dueDate).toDate() : undefined,
  });

  await task.save();

  res.send(task);
});

router.patch(
  "/:id",
  [
    auth,
    idValidator,
    exist(Task),
    validate(tasksUpdateValidate),
    authorizeTaskOwner,
  ],
  async (req, res) => {
    const task = req.doc;
    const { name, status, dueDate } = req.body;

    // 1. Update the fields in memory
    if (name !== undefined) task.name = name;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;

    // 2. Save to the db
    await task.save();

    res.send(task);
  },
);

router.delete(
  "/:id",
  [auth, idValidator, exist(Task), authorizeTaskOwner],
  async (req, res) => {
    const task = req.doc;

    await task.deleteOne();

    res.send({ deleted: task });
  },
);

export default router;
