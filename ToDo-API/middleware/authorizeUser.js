import { asAppError } from "../utils/appError.js";

export const authorizeUser = (req, res, next) => {
  // This should normally be caught by `exist(...)`, but we keep a defensive check.
  if (!req.doc) {
    return next(
      asAppError({
        status: 404,
        code: "NOT_FOUND",
        message: "User not found",
      }),
    );
  }

  if (req.doc.id === req.user.id) return next();
  return next(
    asAppError({
      status: 403,
      code: "FORBIDDEN",
      message: "Access denied.",
    }),
  );
};
