import express from "express";
import tasks from "../routes/tasks.js";
import users from "../routes/users.js";
import auth from "../routes/auth.js";
import addAdmin from "../routes/addAdmin.js";
import { errorMiddleware } from "../middleware/error.js";

export default function (app) {
  app.use(express.json());
  app.use("/api/tasks/", tasks);
  app.use("/api/users/", users);
  app.use("/api/users/", addAdmin);
  app.use("/api/auth/", auth);
  app.use(errorMiddleware);
}
