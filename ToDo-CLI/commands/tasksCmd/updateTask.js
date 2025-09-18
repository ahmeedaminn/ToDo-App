import dotenv from "dotenv";
import { apiRequest } from "../../utils/api.js";

dotenv.config({ quiet: true });

export async function updateTask(id, name, status = "pending", dueDate = null) {
  try {
    const taskData = { name, status };
    if (dueDate) taskData.dueDate = dueDate;

    const { data } = await apiRequest("patch", `/tasks/${id}`, taskData, true);

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
    } else console.error("❌ Failed to create task:", err.message);
  }
}
