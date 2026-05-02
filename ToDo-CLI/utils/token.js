import fs from "fs";
import jwt from "jsonwebtoken";
import os from "os";
import path from "path";

// Store the token in a file in the user's home directory
const TOKEN_FILE = path.join(os.homedir(), ".todo-cli-token");

export const saveToken = function (token) {
  fs.writeFileSync(TOKEN_FILE, token, "utf-8");
};

export const getToken = function () {
  if (!fs.existsSync(TOKEN_FILE)) {
    return null;
  }
  const token = fs.readFileSync(TOKEN_FILE, "utf-8");

  try {
    const decoded = jwt.decode(token);
    if (decoded.exp * 1000 < Date.now()) {
      // Token expired, delete it

      fs.unlinkSync(TOKEN_FILE);
      return null;
    }
  } catch (err) {
    // Invalid token, delete it
    fs.unlinkSync(TOKEN_FILE);
    return null;
  }

  return token;
};

export const logout = function () {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
    console.log("✅ Logged out successfully.");
  } else console.log("⚠️ No user is logged in.");
};
