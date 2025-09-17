import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export async function getTasks() {
  try {
    const res = await axios.get(`${API_URL}/tasks`);
    return res.data;
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    return [];
  }
}
