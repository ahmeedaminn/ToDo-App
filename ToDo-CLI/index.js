#!/usr/bin/env node
import { login } from "./commands/userCmd/login.js";
import { getTasks, fetchTasks } from "./commands/tasksCmd/listTasks.js";
import { logout } from "./utils/token.js";
import { createTask } from "./commands/tasksCmd/createTask.js";
import { getTaskByIndex } from "./utils/tasks.js";
import { setTasks } from "./utils/tasks.js";
import { updateTask } from "./commands/tasksCmd/updateTask.js";
import { getToken } from "./utils/token.js";
import yargs from "yargs";
import { deleteTask } from "./commands/tasksCmd/removeTask.js";
import { register } from "./commands/userCmd/register.js";
import { getAllUsers } from "./commands/userCmd/getAllUsers.js";
import { getUser } from "./commands/userCmd/getUser.js";
import jwt from "jsonwebtoken";
import { setAdmin } from "./commands/userCmd/addAdmin.js";
import { deleteUser } from "./commands/userCmd/removeUser.js";
import { updateUser } from "./commands/userCmd/updateUser.js";

// get arguments from the array nodejs create
const argv = yargs(process.argv.slice(2)).argv;
const command = argv._[0];

let task;
let index;
let token;
let decoded;
let id;
let isAdmin;

// 🔹 refresh tasks cache automatically (but don’t print to console)
try {
  const tasks = await fetchTasks();
  if (tasks) {
    setTasks(tasks);
  }
} catch (err) {
  console.error("Please, Login first.", err.message);
}

switch (command) {
  case "sign-up":
    if (!argv.email || !argv.username || !argv.pass) {
      console.log("Sign up with <email> <username> <password> ");
      break;
    }

    await register(argv.email, argv.username, argv.pass);
    break;
  //
  case "login":
    //
    if (!argv.username || !argv.pass) {
      console.log("login with <username/email> <password> ");
      break;
    }

    await login(argv.username, argv.pass);
    break;
  //
  case "set-admin":
    //
    const result = await setAdmin(argv.username, argv.value);
    console.log(result);

    break;
  //
  case "get-user":
    //
    token = getToken();
    if (token) {
      decoded = jwt.decode(token);
      id = decoded._id;
      isAdmin = decoded.isAdmin;
    }

    if (isAdmin) {
      await getUser(argv.username, "by-username");
      break;
    }

    await getUser(id, "by-id");
    break;
  //
  case "list-users":
    //
    await getAllUsers();
    break;
  //
  case "update-user":
    token = getToken();
    if (token) {
      decoded = jwt.decode(token);
      id = decoded._id;
    }

    await updateUser(id, argv.username, argv.email, argv.pass);
    break;
  //
  case "delete-user":
    token = getToken();
    if (token) {
      decoded = jwt.decode(token);
      id = decoded._id;
      isAdmin = decoded.isAdmin;
    }

    if (isAdmin) {
      await deleteUser(argv.username, "by-username");
      break;
    }

    await deleteUser(id, "by-id");
    break;
  case "list-tasks":
    //
    const users = await getAllUsers(argv.username, argv.pass);
    console.log(users); // ✅ print here
    break;
  //
  case "create-task":
    //
    await createTask(argv.name, argv.status, argv.dueDate);
    break;
  //
  case "update-task":
    //
    if (!getToken()) {
      console.error("❌ Please login first.");
      break;
    }

    index = argv._[1];
    if (!index) {
      console.error("❌ Please provide valid task index.");
      break;
    }

    task = getTaskByIndex(index);
    if (!task) {
      console.error("❌ Invalid task index.");
      break;
    }

    await updateTask(task._id, argv.name, argv.status, argv.dueDate);

    break;
  //
  case "delete-task":
    if (!getToken()) {
      console.error("❌ Please login first.");
      break;
    }

    index = argv._[1];
    if (!index) {
      console.error("❌ Please provide valid task index.");
      break;
    }

    task = getTaskByIndex(index);
    if (!task) {
      console.error("❌ Invalid task index.");
      break;
    }
    await deleteTask(task._id);

    break;
  //
  case "logout":
    //
    logout();
    break;
  //
  default:
    console.log("Unknown command. Try: login, list-tasks");
}
