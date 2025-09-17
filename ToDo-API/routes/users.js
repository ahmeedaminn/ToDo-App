import express from "express";
import bcrypt from "bcrypt";
import { validate } from "../middleware/validate.js";
import {
  usersCreateValidate,
  usersUpdateValidate,
  User,
} from "../models/users.js";
import { auth } from "../middleware/auth.js";
import { exist } from "../middleware/exist.js";
import { idValidator } from "../middleware/idValidator.js";
import { authorizeUser } from "../middleware/authorizeUser.js";
import { authorizeBoth } from "../middleware/authorizeBoth.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";
import _ from "lodash";
const router = express.Router();

router.get("/", [auth, authorizeAdmin], async (req, res) => {
  const users = await User.find().select("-password");
  res.send(users);
});

// GET id
router.get(
  "/:id",
  [idValidator, auth, exist(User), authorizeBoth],
  async (req, res) => {
    const user = req.doc;
    res.send(user);
  }
);

// POST
router.post("/", validate(usersCreateValidate), async (req, res) => {
  const existingUser = await User.findOne({
    $or: [{ email: req.body.email }, { userName: req.body.userName }],
  });

  if (existingUser) {
    return res.status(400).json({
      error:
        existingUser.email === req.body.email
          ? "User with given email already exists"
          : "User with given userName already exists",
    });
  }

  const user = new User(_.pick(req.body, ["userName", "password", "email"]));

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = user.generateAuthToken();

  res.header("x-auth-token", token).send(user);
});

// PUT
router.patch(
  "/:id",
  [
    auth,
    idValidator,
    exist(User),
    validate(usersUpdateValidate),
    authorizeUser,
  ],
  async (req, res) => {
    const { userName, password, email } = req.body;

    const updatedData = {};

    // Handle Password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }

    // Field to check uniqueness
    const uniqueFields = { email, userName };

    for (const [field, value] of Object.entries(uniqueFields)) {
      if (!value) continue;

      const existing = await User.findOne({
        [field]: value,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res.status(400).json({
          error: `ERROR 400, user with given ${field} already exists`,
        });
      }

      updatedData[field] = value;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    res.send(updatedUser);
  }
);

// DELETE
router.delete(
  "/:id",
  [auth, idValidator, exist(User), authorizeBoth],
  async (req, res) => {
    const user = req.doc;

    await user.deleteOne();

    res.send({ deleted: user });
  }
);

export default router;
