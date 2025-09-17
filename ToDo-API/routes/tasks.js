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

router.get("/", auth, async (req, res) => {
  const tasks = await Task.find({ "user.userId": req.user._id });
  res.send(tasks);
});

router.post("/", [auth, validate(tasksValidate)], async (req, res) => {
  const { name, status, dueDate } = req.body;

  const task = new Task({
    name,
    status,
    user: {
      userId: req.user._id,
      userName: req.user.userName,
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
    const { name, status, dueDate } = req.body;

    // Only include fields that are actually provided in the request
    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (status !== undefined) updatedData.status = status;
    if (dueDate !== undefined) updatedData.dueDate = dueDate;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedTask) return res.status(404).json({ error: "Task not found" });

    res.send(updatedTask);
  }
);

router.delete(
  "/:id",
  [auth, idValidator, exist(Task), authorizeTaskOwner],
  async (req, res) => {
    const task = req.doc;

    await task.deleteOne();

    res.send({ deleted: task });
  }
);

export default router;
