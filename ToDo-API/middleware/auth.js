import jwt from "jsonwebtoken";
// import { User } from "../models/users.js";
import prisma from "../startup/prisma.js";
import { asAppError } from "../utils/appError.js";

export const auth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return next(
      asAppError({
        status: 401,
        code: "AUTH_NO_TOKEN",
        message: "No token provided",
      }),
    );
  }

  try {
    // if the token is expired or invalid, jwt.verify will throw an error and the catch block will handle it. If it's valid, it returns the decoded payload.
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

    // 1. Fetch the user from the database to get their latest timestamps
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user) {
      return next(
        asAppError({
          status: 401,
          code: "AUTH_INVALID_TOKEN",
          message: "Invalid token provided",
        }),
      );
    }

    if (user.tokenValidAfter) {
      // JWT 'iat' is in seconds, but JS Dates are in milliseconds. We must convert it!
      const cutoffTimestamp = parseInt(
        user.tokenValidAfter.getTime() / 1000,
        10,
      );

      // 3. The Math Check: Was the token issued BEFORE the token became invalid?
      if (cutoffTimestamp > decoded.iat) {
        return next(
          asAppError({
            status: 401,
            code: "AUTH_TOKEN_EXPIRED",
            message: "Token expired, please login again",
          }),
        );
      }
    }

    req.user = decoded; // payload (id, username, isAdmin)
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        asAppError({
          status: 401,
          code: "AUTH_TOKEN_EXPIRED",
          message: "Token expired, please login again",
          cause: err,
        }),
      );
    }
    return next(
      asAppError({
        status: 400,
        code: "AUTH_INVALID_TOKEN",
        message: "Invalid token provided",
        cause: err,
      }),
    );
  }
};
