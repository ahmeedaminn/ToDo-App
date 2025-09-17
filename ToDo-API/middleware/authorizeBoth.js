export const authorizeBoth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  if (!req.doc) return res.status(404).json({ error: "User not found" });

  if (req.user.isAdmin) return next(); // admins can always proceed

  if (req.doc._id.equals(req.user._id)) return next(); // same user can proceed

  return res.status(403).json({ error: "Access denied." });
};
