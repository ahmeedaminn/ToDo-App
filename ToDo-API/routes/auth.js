import express from "express";
import Joi from "joi";
import { validate } from "../middleware/validate.js";
import { User } from "../models/users.js";
import bcrypt from "bcrypt";
const router = express.Router();

const authValidator = function (req) {
  const scheme = Joi.object({
    username: Joi.string().min(3).max(50),
    password: Joi.string().min(8).max(50).required(),
    email: Joi.string().min(5).max(50).email(),
  }).xor("email", "username");

  return scheme.validate(req);
};

router.post("/", validate(authValidator), async (req, res) => {
  const { email, username, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: email?.trim() }, { username: username?.trim() }],
  });
  if (!user)
    return res.status(401).json({
      error: "Invalid email/username or password",
    });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(401).json({
      error: "Invalid email/username or password",
    });

  const token = user.generateAuthToken();

  res.header("x-auth-token", token).send(token);
});

export default router;
