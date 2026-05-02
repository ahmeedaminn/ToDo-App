import pg from "pg";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

/**
 * Jest Global Setup (Integration Tests)
 * ------------------------------------
 * Constraints (per your request):
 * - No Testcontainers
 * - Reuse the existing Docker Postgres container
 * - Auto-create DB `ticketing_test` if missing
 * - Run `prisma db push` against the test database before tests run
 *
 * How it works:
 * - We connect to the Postgres *server* using a URL that points to the default `postgres` DB.
 * - We create the test database if it doesn't exist.
 * - We run Prisma schema push against `DATABASE_URL_TEST`.
 */
export default async function globalSetup() {
  // Load `.env` so local integration runs match `docker-compose` configuration.
  dotenv.config();

  const testDbName = "ticketing_test";

  // Prefer explicit DATABASE_URL_TEST; otherwise derive it from DATABASE_URL.
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error("DATABASE_URL must be set for integration tests.");
  }

  const testUrl =
    process.env.DATABASE_URL_TEST ||
    (() => {
      const u = new URL(baseUrl);
      u.pathname = `/${testDbName}`;
      return u.toString();
    })();

  process.env.DATABASE_URL_TEST = testUrl;
  process.env.NODE_ENV = "test";

  // Connect to the server's default DB so we can CREATE DATABASE.
  const adminUrl = (() => {
    const u = new URL(baseUrl);
    u.pathname = "/postgres";
    return u.toString();
  })();

  const { Client } = pg;
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  try {
    // Check existence
    const existsRes = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [testDbName],
    );

    if (existsRes.rowCount === 0) {
      // Important: DB identifiers cannot be parameterized in Postgres, so we keep it fixed.
      await client.query(`CREATE DATABASE ${testDbName}`);
    }
  } finally {
    await client.end();
  }

  // Run Prisma db push against DATABASE_URL_TEST
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, "..", "..");

  const env = {
    ...process.env,
    DATABASE_URL: testUrl, // Prisma reads DATABASE_URL
  };

  /**
   * Prisma CLI invocation note:
   * To avoid `npx` and Windows `.cmd` spawning edge-cases under Jest,
   * we invoke Prisma's JS entrypoint via `node`.
   */
  const prismaEntrypoint = path.join(
    projectRoot,
    "node_modules",
    "prisma",
    "build",
    "index.js",
  );

  execFileSync(process.execPath, [prismaEntrypoint, "db", "push"], {
    cwd: projectRoot,
    stdio: "inherit",
    env,
  });

  /**
   * MinIO bootstrap:
   * The upload routes assume the bucket exists.
   * For repeatable integration tests, ensure the bucket is present.
   */
  const bucket = process.env.S3_BUCKET_NAME;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3_ENDPOINT, S3_BUCKET_NAME, S3_ACCESS_KEY, and S3_SECRET_KEY must be set for integration tests.",
    );
  }

  const s3 = new S3Client({
    region: "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

