import express from "express";
import dotenv from "dotenv";
// import db from "./startup/db.js";
import prisma, { disconnectPrisma } from "./startup/prisma.js";
import routes from "./startup/routes.js";
import { logger } from "./startup/logger.js";
import { fileURLToPath } from "url";

export const app = express();
dotenv.config();
// db(); // We don't need this anymore, Prisma handles the connection pooling and management for us
routes(app);

/**
 * Start the HTTP server.
 * Exported to allow Jest/Supertest to import `app` without auto-binding a port.
 */
export function startServer(port = process.env.PORT || 3000) {
  const server = app.listen(port, () =>
    logger.info(`Listening on port ${port}`),
  );

  /**
   * Graceful shutdown (Docker/Kubernetes friendly)
   * ----------------------------------------------
   * When the container stops, we:
   * - stop accepting new connections
   * - disconnect Prisma and close the underlying pg pool
   */
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    server.close(async () => {
      try {
        await disconnectPrisma();
        logger.info("Prisma disconnected successfully.");
      } catch (err) {
        logger.error("Error during Prisma disconnect", err);
      } finally {
        process.exit(0);
      }
    });

    // Safety valve: do not hang forever
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
}

// Only start listening when running `node index.js` directly (not when imported by tests).
const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun && process.env.NODE_ENV !== "test") {
  startServer();
}
