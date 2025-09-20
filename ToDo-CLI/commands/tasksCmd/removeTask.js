import dotenv from "dotenv";
import { apiRequest } from "../../utils/api.js";

dotenv.config({ quiet: true });

export async function deleteTask(id) {
  try {
    const res = await apiRequest("delete", `/tasks/${id}`, null, true);

    console.log("🗑️ Task deleted successfully!");
    if (res.data?.name) {
      console.log(`   Deleted: ${res.data.name}`);
    }
  } catch (err) {
    if (err.message.includes("Not logged in")) {
      console.error("❌ Please login first.");
    } else console.error("❌ Failed to update task:", err.message);
  }
}
