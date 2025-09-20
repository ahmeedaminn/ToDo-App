import { saveToken } from "../../utils/token.js";
import { apiRequest } from "../../utils/api.js";

export const register = async function (email, username, password) {
  try {
    const { data, headers } = await apiRequest("post", "/users", {
      email,
      username,
      password,
    });

    const token = headers["x-auth-token"];

    console.log("New user created successfully!");
    return saveToken(token);
  } catch (err) {
    const apiError =
      err.response?.data?.error || err.response?.data || err.message;

    console.error("Sign up failed:", apiError);
  }
};
