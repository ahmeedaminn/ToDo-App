export default {
  testEnvironment: "node",
  transform: {}, // don't use Babel here
  testTimeout: 20000,
  detectOpenHandles: true,
  forceExit: true,
  /**
   * We keep the old Mongo implementation under `_archive_mongo/` for reference,
   * but it must never be executed as part of the active Prisma/Postgres test suite.
   */
  testPathIgnorePatterns: ["/node_modules/", "/_archive_mongo/"],

  // Our new integration tests live here
  testMatch: ["**/tests/**/*.test.js"],

  /**
   * DB bootstrap:
   * - ensures `ticketing_test` exists on the running Docker Postgres container
   * - runs `prisma db push` against DATABASE_URL_TEST
   */
  globalSetup: "./tests/setup/globalSetup.js",
};
