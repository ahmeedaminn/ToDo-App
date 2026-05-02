import request from "supertest";
import bcrypt from "bcrypt";
import fs from "fs";
import os from "os";
import path from "path";
import { app, startServer } from "../../index.js";
import prisma from "../../startup/prisma.js";
import { generateAuthToken } from "../../utils/auth.js";

/**
 * Integration Test: Task creation + MinIO upload
 * ---------------------------------------------
 * This test hits real HTTP routes (Supertest) and uses:
 * - Postgres (via Prisma) on the existing Docker Postgres container
 * - MinIO (S3-compatible) on the existing Docker MinIO container
 *
 * It intentionally avoids Testcontainers to keep the workflow lightweight and predictable.
 */

let server;

async function resetDb() {
  // Order matters because of foreign keys (Task → User)
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});
}

async function createUserAndToken() {
  const password = "Password123!";
  const salt = await bcrypt.genSalt(4); // faster for tests
  const hashed = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      username: `user_${Date.now()}`,
      email: `user_${Date.now()}@email.com`,
      password: hashed,
      role: "EMPLOYEE",
    },
  });

  const token = generateAuthToken(user);
  return { user, token };
}

describe("Tasks API (Prisma + MinIO)", () => {
  beforeAll(() => {
    // Start an ephemeral port; tests should not rely on a fixed local port.
    server = startServer(0);
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("creates a Task and uploads an attachment to MinIO", async () => {
    const { token } = await createUserAndToken();

    // 1) Create a new task
    const createRes = await request(server)
      .post("/api/tasks/")
      .set("x-auth-token", token)
      .send({
        title: "Integration Test Task",
        description: "Created by Jest + Supertest",
        priority: "MEDIUM",
        status: "TODO",
      });

    expect(createRes.status).toBe(200);
    expect(createRes.body).toHaveProperty("id");

    const taskId = createRes.body.id;

    // 2) Upload a small file (using a temp file path so Supertest can attach it)
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "todo-api-test-"));
    const tmpFile = path.join(tmpDir, "hello.pdf");
    // The upload middleware accepts PDFs/images/Word docs only, so we send a small PDF-shaped payload.
    fs.writeFileSync(tmpFile, "%PDF-1.4\n% integration test\n");

    const uploadRes = await request(server)
      .post(`/api/tasks/${taskId}/upload`)
      .set("x-auth-token", token)
      .attach("file", tmpFile, { contentType: "application/pdf" });

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body).toHaveProperty("attachmentUrl");
    expect(uploadRes.body.attachmentUrl).toContain(
      `/${process.env.S3_BUCKET_NAME}/`,
    );
  });
});

