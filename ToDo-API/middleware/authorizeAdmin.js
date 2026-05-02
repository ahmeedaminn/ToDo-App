import { asAppError } from "../utils/appError.js";

export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return next(
      asAppError({
        status: 403,
        code: "FORBIDDEN_ADMIN_ONLY",
        message: "Admin access required.",
      }),
    );
  }

  next();
};
