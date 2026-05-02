import { asAppError } from "../utils/appError.js";

export const validate = function (validator) {
  return (req, res, next) => {
    const { error } = validator(req.body);
    if (error) {
      /**
       * Validation errors are expected client errors.
       * We forward them to the global error middleware so the response structure
       * is 100% consistent across the entire API.
       */
      return next(
        asAppError({
          status: 400,
          code: "VALIDATION_ERROR",
          message: error.details[0].message,
          details: error.details,
        }),
      );
    }

    next();
  };
};
