import { asAppError } from "../utils/appError.js";

export const authorizeTaskOwner = (req, res, next) => {
  // This should normally be caught by `exist(...)`, but we keep a defensive check.
  if (!req.doc) {
    return next(
      asAppError({
        status: 404,
        code: "NOT_FOUND",
        message: "Task not found",
      }),
    );
  }

  // For tasks: compare task's owner ID with authenticated user's ID
  if (req.doc.creatorId === req.user.id || req.doc.assigneeId === req.user.id)
    return next();
  return next(
    asAppError({
      status: 403,
      code: "FORBIDDEN",
      message: "Access denied.",
    }),
  );
};
