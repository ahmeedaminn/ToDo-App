import { User } from "../models/users";
import { Task } from "../models/tasks.js";
import bcrypt from "bcrypt";

/**
 * Create a user in the DB and return { user, token }
 */
export const createUser = async function ({
  username = "user_" + Date.now() + Math.random(),
  password = "12345678",
  email = `user_${Date.now()}@email.com`,
  isAdmin = false,
} = {}) {
  const saltRounds = process.env.NODE_ENV === "test" ? 4 : 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPass = await bcrypt.hash(password, salt);
  const user = new User({
    username,
    password: hashedPass,
    email,
    isAdmin,
  });
  await user.save();
  const token = user.generateAuthToken();
  return { user, token, plainPass: password };
};

/**
 * Create a Task in the DB and return { task }
 */
export const createTask = async function ({
  name = "testTask",
  status = "pending",
  dueDate = "2025/10/10",
  user, // pass in a user object
} = {}) {
  if (!user) throw new Error("createTask requires a user");
  const task = new Task({
    name,
    status,
    dueDate,
    user: {
      userId: user._id,
      username: user.username,
    },
  });
  await task.save();
  return { task };
};

/**
 * Reset the database before each test
 */

export const resetDb = async () => {
  await Task.deleteMany({});
  await User.deleteMany({});
};

/**
 * Spin up a standard set of test users:
 * - normal user
 * - admin user
 * - another user
 */
export const setupUsers = async () => {
  const { user, token: userToken, plainPass } = await createUser();
  const { user: adminUser, token: adminToken } = await createUser({
    isAdmin: true,
  });
  const { user: otherUser, token: otherToken } = await createUser({
    username: "other_" + Date.now() + Math.random(),
    email: `other_${Date.now()}@email.com`,
  });

  return {
    user,
    adminUser,
    otherUser,

    userId: user._id,
    adminId: adminUser._id,
    otherId: otherUser._id,

    userToken,
    adminToken,
    otherToken,

    plainPass,
  };
};

export const buildUser = function (overrides = {}) {
  return {
    username: "updateUser",
    password: "1234567890",
    email: "updated@email.com",
    ...overrides,
  };
};

export const buildTask = function (overrides = {}) {
  return {
    name: "task1",
    status: "pending",
    dueDate: "2025/10/5",
    ...overrides,
  };
};
