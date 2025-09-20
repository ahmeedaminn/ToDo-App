import fs from "fs";
import os from "os";
import path from "path";

const CACHE_PATH = path.join(os.homedir(), ".todo-cli-cache.json");

// save tasks to file
export const setTasks = function (list) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(list, null, 2));
};

// load the tasks from the file
export const getTaskByIndex = function (index) {
  if (!fs.existsSync(CACHE_PATH)) return null;
  const tasks = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  return tasks[index - 1];
};
