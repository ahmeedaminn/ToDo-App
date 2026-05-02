import dotenv from "dotenv";
import pg from "pg";

/**
 * Total DB Cleanup (Postgres)
 * -------------------------
 * What it does:
 * - Checks to ensure we are NOT in production.
 * - Extracts the main DB name from DATABASE_URL.
 * - Connects to the Postgres server (via the default 'postgres' db).
 * - Drops and recreates BOTH the main DB and `ticketing_test`.
 */

dotenv.config({ path: "../.env" });

async function resetDatabases() {
  // 1. SAFETY LOCK: Never allow this script to run in production.
  if (process.env.NODE_ENV === "production") {
    throw new Error("🚨 ABORT: You just tried to wipe the production database. Script blocked.");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to reset the databases.");
  }

  // 2. Extract database names
  const dbUrl = new URL(process.env.DATABASE_URL);
  const mainDbName = dbUrl.pathname.substring(1); // Strips the leading '/' (e.g., 'nmu_ticketing')
  const testDbName = "ticketing_test";
  
  // Array of target databases
  const databasesToReset = [testDbName, mainDbName];

  // 3. Connect to the default 'postgres' admin database
  const adminUrl = (() => {
    const u = new URL(process.env.DATABASE_URL);
    u.pathname = "/postgres";
    return u.toString();
  })();

  const { Client } = pg;
  const client = new Client({ connectionString: adminUrl });

  await client.connect();
  
  try {
    console.log("🔥 INITIATING TOTAL DATABASE RESET...\n");

    for (const dbName of databasesToReset) {
      console.log(`⏳ Terminating connections and dropping: ${dbName}...`);
      
      // Terminate any active connections (like Prisma Studio) before dropping
      await client.query(
        `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid();
        `,
        [dbName]
      );

      // Drop and recreate
      await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      
      console.log(`✅ [${dbName}] wiped and completely recreated.\n`);
    }

    console.log("✅ All databases reset successfully!");
    console.log("⚠️  CRITICAL: You just deleted all your Prisma tables in the main DB.");
    console.log("🚀 Next step: Run 'npx prisma migrate dev' to rebuild your tables.");
    
  } finally {
    await client.end();
  }
}

resetDatabases().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exitCode = 1;
});