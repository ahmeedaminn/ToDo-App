import axios from "axios";
import { getToken } from "./token.js";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const API_URL = process.env.API_URL;

export const apiRequest = async function (
  method,
  endpoint,
  data = null,
  authRequired = false
) {
  try {
    const headers = {};

    if (authRequired) {
      const token = getToken();
      if (!token) throw new Error("Not logged in, please log in first");
      headers["x-auth-token"] = token;
    }

    const res = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers,
    });

    return { data: res.data, headers: res.headers };
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;

      throw new Error(data.error || data.message || `API Error (${status})`);
    }
  }
};
