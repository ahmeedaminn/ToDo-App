import express from "express";
import bcrypt from "bcrypt";
import prisma from "../startup/prisma.js";
import { validate } from "../middleware/validate.js";
import { generateAuthToken } from "../utils/auth.js";
import { authValidator } from "../validations/users.js";
// import { User } from "../models/users.js";
import { asAppError } from "../utils/appError.js";
const router = express.Router();

router.post("/", validate(authValidator), async (req, res) => {
  const { email, username, password } = req.body;



  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: email?.trim() }, { username: username?.trim() }],
    },
  });

  if (!user) {
    throw asAppError({
      status: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid email/username or password",
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw asAppError({
      status: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid email/username or password",
    });
  }

  const token = generateAuthToken(user);

  res.status(200).json({ "x-auth-token": token });
});

export default router;
