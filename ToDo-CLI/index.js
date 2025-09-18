#!/usr/bin/env node
import { login } from "./commands/userCmd/login.js";
import { getTasks } from "./commands/tasksCmd/listTasks.js";
import { logout } from "./utils/token.js";
import { createTask } from "./commands/tasksCmd/createTask.js";

// get arguments from the array nodejs create
const args = process.argv.slice(2);
const command = args[0];

let username;
let password;

switch (command) {
  case "login":
    username = args[1];
    password = args[2];
    if (!username || !password)
      console.log("login with <username/email> <password> ");
    await login(username, password);
    break;
  case "list-tasks":
    await getTasks();
    break;
  case "create-task":
    const name = args[1];
    const status = args[2];
    const dueDate = args[3];
    await createTask(name, status, dueDate);
    break;
  case "logout":
    logout();
    break;

  default:
    console.log("Unknown command. Try: login, list-tasks");
}
