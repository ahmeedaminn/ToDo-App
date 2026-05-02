import express from "express";
import bcrypt from "bcrypt";
// import _ from "lodash";
import prisma from "../startup/prisma.js";
import { validate } from "../middleware/validate.js";
import {
  usersCreateValidate,
  usersUpdateValidate,
} from "../validations/users.js";
import { auth } from "../middleware/auth.js";
import { exist } from "../middleware/exist.js";
import { idValidator } from "../middleware/idValidator.js";
import { authorizeUser } from "../middleware/authorizeUser.js";
import { authorizeBoth } from "../middleware/authorizeBoth.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";
import { generateAuthToken } from "../utils/auth.js";
import { asAppError } from "../utils/appError.js";
const router = express.Router();

// get all users (admin only)
router.get("/", [auth, authorizeAdmin], async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });
  res.send(users);
});

// GET: Fetch all eligible assignees for the frontend dropdown popup
router.get("/assignees", auth, async (req, res) => {
  const staff = await prisma.user.findMany({
    where: {
      // Only fetch users who actually work there
      role: {
        in: ["PROFESSOR", "EMPLOYEE", "TEACHING_ASSISTANT", "ADMIN"],
      },
    },
    // SECURITY: Never send the whole user object (passwords, emails, etc.) to a dropdown!
    // Only select the exact fields the React popup needs to render the list.
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  res.send(staff);
});

// GET id
router.get(
  "/:id",
  [auth, idValidator, exist(prisma.user), authorizeUser],
  async (req, res) => {
    // `exist(...)` middleware injects the record into `req.doc`
    const user = req.doc;

    delete user.password; // Remove password from the response

    res.send({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  },
);

// POST
router.post("/", validate(usersCreateValidate), async (req, res) => {
  const { username, email, password, role } = req.body;
  // 1. Swap findUnique for findFirst so we can use OR!
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: email }, { username: username }],
    },
  });

  if (existingUser) {
    throw asAppError({
      status: 400,
      code: "USER_ALREADY_EXISTS",
      message:
        existingUser.email === req.body.email
          ? "User with given email already exists"
          : "User with given username already exists",
      details: {
        field: existingUser.email === req.body.email ? "email" : "username",
      },
    });
  }

  // 2. Hash the password BEFORE we touch the database!
  const salt = await bcrypt.genSalt(10);
  const hasedPassword = await bcrypt.hash(req.body.password, salt);

  // 3. SECURITY: Role Sanitization & Privilege Escalation Defense
  // By default, if they don't provide a role, it defaults to EMPLOYEE.
  let assignedRole = role || "EMPLOYEE";

  // Prevent anyone from registering as an ADMIN via the public form
  if (assignedRole === "ADMIN") {
    assignedRole = "EMPLOYEE"; // Silently downgrade them, or throw an error
  }

  // 4. Create the user using the newly hashed password
  /** * SECURITY NOTE:
   * Manually extracting username, email, and password prevents Mass Assignment attacks.
   * It ensures hackers cannot inject unauthorized columns into the database.
   */
  const user = await prisma.user.create({
    data: {
      username: req.body.username,
      email: req.body.email,
      password: hasedPassword,
      role: assignedRole,
    },
  });

  const token = generateAuthToken(user);

  // 5. SECURITY: Strip the password before sending the response back
  delete user.password; // Remove password from the response

  // this is wrong as the res.json closes the connection and the .send will never execute. We should combine them into one res.json call.
  res.json({ "x-auth-token": token, user });
});

// POST logout of all devices
router.post("/logout-all", auth, async (req, res) => {
  const user = await prisma.user.update({
    // One single database call to find the user AND update the timestamp!
    where: { id: req.user.id },

    // Prisma requires a standard JavaScript Date object
    data: {
      tokenValidAfter: new Date(),
    },
  });

  res.json({ message: "Successfully logged out of all devices." });
});

// PUT
router.patch(
  "/:id",
  [
    auth,
    idValidator,
    exist(prisma.user),
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

      // FindUnique just work with one filter at a time, so we use findFirst with OR to check for duplicates
      const existing = await prisma.user.findFirst({
        where: {
          [field]: value,
          // Ensure we don't find the same user we're trying to update
          NOT: { id: req.params.id },
        },
      });

      if (existing) {
        throw asAppError({
          status: 400,
          code: "USER_ALREADY_EXISTS",
          message: `User with given ${field} already exists`,
          details: { field },
        });
      }

      updatedData[field] = value;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updatedData,
    });

    delete updatedUser.password; // Remove password from the response

    res.send(updatedUser);
  },
);

// DELETE
router.delete(
  "/:id",
  [auth, idValidator, exist(prisma.user), authorizeUser],
  async (req, res) => {
    const user = req.doc;

    await prisma.user.delete({
      where: { id: user.id },
    });

    res.json({ message: `User ${user.username} deleted successfully` });
  },
);

export default router;
