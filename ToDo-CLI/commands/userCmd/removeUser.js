import { apiRequest } from "../../utils/api.js";
import { logout } from "../../utils/token.js";

export const deleteUser = async function (query, type = "by-id") {
  try {
    const { data } = await apiRequest(
      "delete",
      `/users/${type}/${query}`,
      null,
      true
    );

    logout();

    console.log(data.message);
  } catch (err) {
    const apiError =
      err.response?.data?.error || err.response?.data || err.message;

    console.error(apiError);
  }
};
