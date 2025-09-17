export const authorizeTaskOwner = (req, res, next) => {
  if (!req.doc) return res.status(404).json({ error: "Task not found" });

  // For tasks: compare task's owner ID with authenticated user's ID
  if (req.doc.user.userId.equals(req.user._id)) return next();
  return res.status(403).json({ error: "Access denied." });
};
