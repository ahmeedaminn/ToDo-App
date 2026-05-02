import { apiRequest } from "../../utils/api.js";
import { saveToken } from "../../utils/token.js";

export const login = async function (username, password, options) {
  try {
    const response = await apiRequest("post", "/auth", {
      username,
      password,
    });

    const token = response.data["x-auth-token"];

    if (!token) return console.error("❌ No token found in response headers.");

    console.log("Logged in successfully!");
    return saveToken(token);
  } catch (err) {
    const apiError =
      err.response?.data?.error || err.response?.data || err.message;

    console.error("❌ Login failed:", apiError);
  }
};
