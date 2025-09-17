import winston from "winston";
import "winston-mongodb";

import dotenv from "dotenv";
dotenv.config();

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(), // add time stamp to each log
    winston.format.json() // make logs structured JSON
  ),
  transports: [
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "./logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.MongoDB({
      db: process.env.DB_NAME || process.env.DB_NAME_TEST,
      collection: "logs",
      level: "error",
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "./logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "./logs/rejections.log" }),
  ],
});
