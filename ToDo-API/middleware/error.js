import { logger } from "../startup/logger.js";
import pkg from "@prisma/client";
import { AppError } from "../utils/appError.js";

const { Prisma } = pkg;

/**
 * Global Error Middleware
 * -----------------------
 * This is the *only* place we shape error responses.
 *
 * All routes/middlewares should forward failures using:
 * - `return next(asAppError(...))` for expected errors
 * - or `throw asAppError(...)` inside an async handler (Express 5 will catch it)
 *
 * Response contract (all errors):
 * {
 *   "error": { "code": string, "message": string, "status": number, "details"?: any }
 * }
 */
export const errorMiddleware = function (err, req, res, next) {
  // Prefer the original cause for logging context, but never leak it in responses.
  const logTarget = err?.cause instanceof Error ? err.cause : err;
  logger.error(err?.message || "Unhandled error", logTarget);

  // 1) Expected, app-defined errors
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        status: err.status,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
  }

  // 2) Prisma known errors → standardized API errors
  if (err instanceof Prisma?.PrismaClientKnownRequestError) {
    // Reference: Prisma error codes like P2002 (unique constraint), P2025 (record not found)
    if (err.code === "P2002") {
      return res.status(409).json({
        error: {
          code: "DB_UNIQUE_CONSTRAINT",
          message: "Unique constraint violation",
          status: 409,
          details: err.meta,
        },
      });
    }

    if (err.code === "P2025") {
      return res.status(404).json({
        error: {
          code: "DB_RECORD_NOT_FOUND",
          message: "Requested resource was not found",
          status: 404,
          details: err.meta,
        },
      });
    }
  }

  // 3) Fallback: unknown/unexpected error
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something failed",
      status: 500,
    },
  });
};
