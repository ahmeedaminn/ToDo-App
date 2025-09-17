import { logger } from "../startup/logger.js";
export const errorMiddleware = function (err, req, res, next) {
  logger.error(err.message, err);

  res.status(500).json({ error: "Something Failed" });
};
