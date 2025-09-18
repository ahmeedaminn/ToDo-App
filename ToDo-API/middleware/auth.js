import jwt from "jsonwebtoken";

export const auth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    req.user = decoded; // payload (_id, username, isAdmin)
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token provided" });
  }
};
