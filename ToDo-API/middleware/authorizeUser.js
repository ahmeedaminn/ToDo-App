export const authorizeUser = (req, res, next) => {
  if (!req.doc) return res.status(404).json({ error: "User not found" });

  if (req.doc._id.equals(req.user._id)) return next();
  return res.status(403).json({ error: "Access denied." }); // same user can proceed
};
