import joi from "joi";
import prisma from "../startup/prisma.js";
import express from "express";
import { auth } from "../middleware/auth.js";
// import { User } from "../models/users.js";
import { validate } from "../middleware/validate.js";
import { userRoleValidate } from "../validations/users.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";
import { exist } from "../middleware/exist.js";
const router = express.Router();

router.patch(
  "/:username/set-admin",
  [auth, authorizeAdmin, exist(prisma.user), validate(userRoleValidate)],
  async (req, res) => {
    const updatedUser = await prisma.user.update({
      where: { username: req.params.username },
      data: { role: req.body.role },
    });

    delete updatedUser.password; // Remove password from the response

    // NOTE: return the updated user record (previous code referenced `user` which didn't exist)
    res.json({ message: "Admin status updated", user: updatedUser });
  },
);

export default router;
