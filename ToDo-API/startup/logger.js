import winston from "winston";
import dotenv from "dotenv";
dotenv.config();

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    // 1. Errors go here (O:\your-project\logs\error.log)
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error",
    }),
    // 2. Everything goes here
    new winston.transports.File({ filename: "./logs/combined.log" }),
    // 3. Keep the console colorful for your debugging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "./logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "./logs/rejections.log" }),
  ],
});
