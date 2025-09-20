import express from "express";
import { auth } from "../middleware/auth.js";
import { User } from "../models/users.js";
import { idValidator } from "../middleware/idValidator.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";
import { exist } from "../middleware/exist.js";
const router = express.Router();

router.patch(
  "/:username/set-admin",
  [auth, authorizeAdmin],
  async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user) res.status(404).json({ error: "ERROR 404, User NOT found." });
    const { isAdmin } = req.body;

    // Validate that isAdmin is provided and is boolean
    if (typeof isAdmin !== "boolean") {
      return res.status(400).json({
        error: "isAdmin field is required and must be boolean",
      });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json({ message: "Admin status updated", user });
  }
);

export default router;
