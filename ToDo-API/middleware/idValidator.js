// import mongoose from "mongoose";

// export const idValidator = (req, res, next) => {
//   if (!mongoose.Types.ObjectId.isValid(req.params.id))
//     return res.status(400).json({ error: "ERROR 400, ID is invalid" });

//   next();
// };

import { asAppError } from "../utils/appError.js";

export const idValidator = (req, res, next) => {
  // A standard Regex to check if the string matches a PostgreSQL UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(req.params.id)) {
    /**
     * This is an expected client error.
     * Delegate to global error middleware so every route returns the same structure.
     */
    return next(
      asAppError({
        status: 400,
        code: "INVALID_ID",
        message: "Invalid ID format",
        details: { id: req.params.id },
      }),
    );
  }

  next();
};
