import { apiRequest } from "../../utils/api.js";
import { saveToken } from "../../utils/token.js";

export const login = async function (username, password) {
  try {
    const { headers } = await apiRequest("post", "/auth", {
      username,
      password,
    });

    const token = headers["x-auth-token"];

    if (!token) return console.error("❌ No token found in response headers.");

    console.log("Logged in successfully!");
    return saveToken(token);
  } catch (err) {
    console.error("❌ Login failed:", err.message);
  }
};
