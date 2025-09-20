import dotenv from "dotenv";
import { apiRequest } from "../../utils/api.js";

dotenv.config({ quiet: true });

export const updateUser = async function (id, username, email, password) {
  try {
    if (!username && !email && !password) {
      console.error(
        "❌ Please provide at least one field (--username, --email, --password)."
      );
      return;
    }

    const userData = {};
    if (username) userData.username = username;
    if (email) userData.email = email;
    if (password) userData.password = password;

    const res = await apiRequest("patch", `/users/${id}`, userData, true);
    const data = res.data;

    console.log("✅ User updated successfully!");

    if (username) console.log(`   Username: ${data.username}`);
    if (email) console.log(`   Email: ${data.email}`);
    if (password) console.log(`   Password: (changed)`); // no need to show actual value

    //
  } catch (err) {
    if (err.message.includes("Not logged in")) {
      console.error("❌ Please login first.");
    } else console.error("❌ Failed to update task:", err.message);
  }
};
