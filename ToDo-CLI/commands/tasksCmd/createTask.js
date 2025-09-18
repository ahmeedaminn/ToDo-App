import dotenv from "dotenv";
import { apiRequest } from "../../utils/api.js";

dotenv.config({ quiet: true });

export async function createTask(name, status = "pending", dueDate = null) {
  try {
    const taskData = { name, status };
    if (dueDate) taskData.dueDate = dueDate;

    const { data } = await apiRequest("post", "/tasks", taskData, true);

    console.log("✅ Task created successfully!");
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
