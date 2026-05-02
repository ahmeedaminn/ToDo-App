import { asAppError } from "../utils/appError.js";

export const authorizeBoth = (req, res, next) => {
  /**
   * NOTE:
   * This middleware is a leftover from the Mongo version (it references `isAdmin` and `_id`).
   * We keep it compatible with the Prisma/JWT shape so it can still be used safely,
   * while delegating response formatting to the global error handler.
   */
  if (!req.user) {
    return next(
      asAppError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      }),
    );
  }

  if (!req.doc) {
    return next(
      asAppError({
        status: 404,
        code: "NOT_FOUND",
        message: "User not found",
      }),
    );
  }

  // Prisma JWT payload uses `role`; allow admins to proceed.
  if (req.user.role === "ADMIN") return next();

  if (req.doc.id === req.user.id) return next(); // same user can proceed

  return next(
    asAppError({
      status: 403,
      code: "FORBIDDEN",
      message: "Access denied.",
    }),
  );
};
