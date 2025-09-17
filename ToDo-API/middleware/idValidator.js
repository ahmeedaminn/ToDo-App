import mongoose from "mongoose";

export const idValidator = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ error: "ERROR 400, ID is invalid" });

  next();
};
