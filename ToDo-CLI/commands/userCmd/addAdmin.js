import { apiRequest } from "../../utils/api.js";

export const setAdmin = async function (username, value = false) {
  try {
    // Convert string to boolean if needed
    const boolValue =
      typeof value === "string"
        ? value.toLowerCase() === "true"
        : Boolean(value);

    const { data } = await apiRequest(
      "patch",
      `/users/${username}/set-admin`,
      { isAdmin: boolValue },
      true
    );

    console.log(
      `You set ${username} as ${
        value === true ? "admin" : "not admin"
      } Successfully.`
    );

    return data;
  } catch (err) {
    const apiError =
      err.response?.data?.error || err.response?.data || err.message;

    console.error(apiError);
  }
};
