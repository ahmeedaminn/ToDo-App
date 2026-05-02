import jwt from "jsonwebtoken";

export const generateAuthToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: "15m" },
  );
};
