// src/api/userService.js (Adjust path as needed)
import { apiFetch } from "./fetch";

export const getAssignees = async () => {
  // Matches the Express route you showed me earlier!
  const data = await apiFetch("/users/assignees", { method: "GET" });
  return data;
};

export const createUser = async (userData) => {
  const data = await apiFetch("/users/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  return data;
};

export const userServices = {
  getAssignees,
  createUser,
};