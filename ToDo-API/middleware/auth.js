import jwt from "jsonwebtoken";
import {User} from "../models/users.js";

export const auth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

    // 1. Fetch the user from the database to get their latest timestamps
    const user = await User.findById(decoded._id);
    if (!user) return res.status(401).json({ error: "Invalid token provided" });

    if(user.tokenValidAfter) {
      // JWT 'iat' is in seconds, but JS Dates are in milliseconds. We must convert it!
      const cutoffTimestamp = parseInt(user.tokenValidAfter.getTime() / 1000, 10);

      // 3. The Math Check: Was the token issued BEFORE the token became invalid?
      if (cutoffTimestamp > decoded.iat) {
        return res.status(401).json({ error: "Token expired, Please login again" });
      }
    }

    req.user = decoded; // payload (_id, username, isAdmin)
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token provided" });
  }
};
