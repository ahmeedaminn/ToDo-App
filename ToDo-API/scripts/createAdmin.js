import bcrypt from "bcrypt";
import dotenv from "dotenv";
import prisma, { disconnectPrisma } from "../startup/prisma.js";

dotenv.config({ path: "../.env" }); // path from scripts folder to root .env

const createAdminUser = async function () {
  /**
   * Create initial admin (Prisma/Postgres)
   * -------------------------------------
   * This replaces the old Mongoose-based admin bootstrap.
   *
   * Required env vars:
   * - INTIAL_ADMIN_USERNAME
   * - INTIAL_ADMIN_EMAIL
   * - INTIAL_ADMIN_PASSWORD
   */
  const username = process.env.INTIAL_ADMIN_USERNAME;
  const email = process.env.INTIAL_ADMIN_EMAIL;
  const password = process.env.INTIAL_ADMIN_PASSWORD;

  if (!username || !email || !password) {
    throw new Error(
      "Missing env vars. Expected INTIAL_ADMIN_USERNAME, INTIAL_ADMIN_EMAIL, INTIAL_ADMIN_PASSWORD",
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // If the user already exists, we keep the script idempotent.
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, username: true, email: true, role: true },
  });

  if (existing) {
    console.log("Admin already exists:", existing);
    return;
  }

  const adminUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
    select: { id: true, username: true, email: true, role: true, createdAt: true },
  });

  console.log("Admin created:", adminUser);
};

createAdminUser()
  .catch((err) => {
    console.error("Admin creation failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
