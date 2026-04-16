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
  "/by-id/:id",
  [auth, idValidator, exist(User), authorizeUser],
  async (req, res) => {
    const user = req.doc;
    res.send(user);
  },
);

router.get(
  "/by-username/:username",
  [auth, exist(User), authorizeAdmin],
  async (req, res) => {
    const user = req.doc;

    res.send(user);
  },
);

// POST
router.post("/", validate(usersCreateValidate), async (req, res) => {
  const existingUser = await User.findOne({
    $or: [{ email: req.body.email }, { username: req.body.username }],
  });

  if (existingUser) {
    return res.status(400).json({
      error:
        existingUser.email === req.body.email
          ? "User with given email already exists"
          : "User with given username already exists",
    });
  }

  const user = new User(_.pick(req.body, ["username", "password", "email"]));

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = user.generateAuthToken();

  res.header("x-auth-token", token).send(user);
});

// POST logout of all devices
router.post("/logout-all", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Update the timestamp to right now
  user.passwordChangedAt = Date.now();
  await user.save();

  res.json({ message: "Successfully logged out of all devices." });
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
    const { username, password, email } = req.body;

    const updatedData = {};

    // Handle Password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);

      updatedData.tokenValidAfter = new Date();
    }

    // Field to check uniqueness
    const uniqueFields = { email, username };

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

    const user = req.doc;
    if (updatedData.username) user.username = updatedData.username;
    if (updatedData.password) user.password = updatedData.password;
    if (updatedData.email) user.email = updatedData.email;

    await user.save();

    res.send(user);
  },
);

// DELETE
router.delete(
  "/by-id/:id",
  [auth, idValidator, exist(User), authorizeUser],
  async (req, res) => {
    const user = req.doc;

    await user.deleteOne();

    res.json({ message: `User ${user.username} deleted successfully` });
  },
);

// DELETE
router.delete(
  "/by-username/:username",
  [auth, exist(User), authorizeAdmin],
  async (req, res) => {
    const user = req.doc;

    // delete all tasks associated with the user
    await Task.deleteMany({ "user.userId": user._id });

    // then delete the user
    await user.deleteOne();

    res.json({ message: `User ${user.username} deleted successfully` });
  },
);

export default router;
