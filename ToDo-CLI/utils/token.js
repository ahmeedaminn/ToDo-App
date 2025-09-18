import fs from "fs";
const TOKEN_FILE = ".token";

export const saveToken = function (token) {
  fs.writeFileSync(TOKEN_FILE, token, "utf-8");
};

export const getToken = function () {
  if (fs.existsSync(TOKEN_FILE)) {
    return fs.readFileSync(TOKEN_FILE, "utf-8");
  }
  return null;
};

export const logout = function () {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
    console.log("✅ Logged out successfully.");
  } else console.log("⚠️ No user is logged in.");
};
