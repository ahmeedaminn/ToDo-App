import dotenv from "dotenv";
import { apiRequest } from "../../utils/api.js";

dotenv.config({ quiet: true });

export const updateTask = async function (id, name, status, dueDate) {
  try {
    if (!name && !status && !dueDate) {
      console.error(
        "❌ Please provide at least one field (--name, --status, --dueDate)."
      );
      return;
    }

    const taskData = {};
    if (name) taskData.name = name;
    if (status) taskData.status = status;
    if (dueDate) taskData.dueDate = dueDate;

    const res = await apiRequest("patch", `/tasks/${id}`, taskData, true);
    const data = res.data;

    console.log("✅ Task updated successfully!");
    console.log(`   Name: ${data.name}`);
    console.log(`   Status: ${data.status}`);
    if (data.dueDate) {
      console.log(
        `   Due: ${new Date(data.dueDate).toLocaleDateString("en-GB")}`
      );
    }
  } catch (err) {
    if (err.message.includes("Not logged in")) {
      console.error("❌ Please login first.");
    } else console.error("❌ Failed to update task:", err.message);
  }
};
