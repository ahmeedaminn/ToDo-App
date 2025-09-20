import { apiRequest } from "../../utils/api.js";

export const getUser = async function (query, type = "by-id") {
  try {
    const { data } = await apiRequest(
      "get",
      `/users/${type}/${query}`,
      null,
      true
    );

    console.log(data); // ✅ print here

    return data;
  } catch (err) {
    const apiError =
      err.response?.data?.error || err.response?.data || err.message;

    console.error(apiError);
  }
};
