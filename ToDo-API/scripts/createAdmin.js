import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models/users.js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" }); // path from scripts folder to root .env

mongoose
  .connect(process.env.DB_NAME)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.error("DB connection failed:", err));

const createAdminUser = async function () {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("Ahmedamin123!", salt);

  const adminUser = new User({
    userName: "ahmedamin",
    email: "ahmedamin11334@icloud.com",
    password: hashedPassword,
    isAdmin: true,
  });

  await adminUser.save();
  console.log("Admin created:", adminUser);
  mongoose.disconnect();
};
createAdminUser();
