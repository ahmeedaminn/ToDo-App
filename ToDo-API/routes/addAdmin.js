import joi from "joi";
import express from "express";
import { auth } from "../middleware/auth.js";
import { User } from "../models/users.js";
import { validate } from "../middleware/validate.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";
import { exist } from "../middleware/exist.js";
const router = express.Router();

const addAdminValidator = (body) => {
  return joi
    .object({
      isAdmin: joi.boolean().required(),
    })
    .validate(body);
};

router.patch(
  "/:username/set-admin",
  [auth, authorizeAdmin, exist(User), validate(addAdminValidator)],
  async (req, res) => {
    const user = req.doc;
    const { isAdmin } = req.body;

    user.isAdmin = isAdmin;
    await user.save();

    res.json({ message: "Admin status updated", user });
  },
);

export default router;
