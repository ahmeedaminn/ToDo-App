import dotenv from "dotenv";
import { apiRequest } from "../../utils/api.js";
import { getToken } from "../../utils/token.js";

dotenv.config({ quiet: true });

export const fetchTasks = async function () {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await apiRequest("get", "/tasks", null, true);
    const data = res.data;
    return data;
  } catch (err) {
    return null; // fail silently for cache use
  }
};

export async function getTasks() {
  try {
    const data = await fetchTasks();
    if (!data) {
      throw new Error("Not logged in. Please, login first.");
    }

    if (data.length === 0) {
      console.log("📭 No tasks found.");
      return;
    }

    console.log("📋 Your Tasks:");

    data.forEach((task, index) => {
      const createdDate = new Date(task.createdAt).toLocaleDateString("en-GB");

      // only format dueDate if it exists
      let dueDateText = "";
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate).toLocaleDateString("en-GB");
        dueDateText = ` - due: ${dueDate}`;
      }

      console.log(
        `${index + 1}. ${task.name} [${
          task.status
        }] - created: ${createdDate}${dueDateText}`
      );
    });

    return data;
  } catch (err) {
    if (err.message.includes("Not logged in"))
      console.error("❌ Please, login first.");
    //
    else console.error("❌ Error fetching tasks:", err.message);

    return;
  }
}
