import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "./logger.js";
dotenv.config;

export default function () {
  const dbConnection =
    process.env.NODE_ENV === "test"
      ? process.env.DB_NAME_TEST
      : process.env.DB_NAME;

  if (!dbConnection) {
    logger.error(
      "Database connection string is not found in the environment variables"
    );
    process.exit(1);
  }

  mongoose
    .connect(dbConnection)
    .then(() => logger.info(`Connected to ${dbConnection}`))
    .catch((err) => console.error(err));
}
