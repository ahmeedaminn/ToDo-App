import express from "express";
// import mongoose from "mongoose";
// import { User } from "../models/users.js";
import dayjs from "dayjs";
import crypto from "crypto";
import prisma from "../startup/prisma.js";
import {
  tasksValidate,
  tasksUpdateValidate,
  taskResolveValidate,
} from "../validations/tasks.js";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { exist } from "../middleware/exist.js";
import { authorizeTaskOwner } from "../middleware/authorizeTaskOwner.js";
import { idValidator } from "../middleware/idValidator.js";
import { upload } from "../middleware/upload.js";
import { s3, presignS3Client } from "../utils/s3.js";
import { asAppError } from "../utils/appError.js";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; //

const router = express.Router();

// get all tasks for the authenticated user
router.get("/", [auth], async (req, res, next) => {
  const tasks = await prisma.task.findMany({
    where: {
      // We use OR to fetch tasks the user either created OR has been assigned to fix

      // STEP 1: THE SEARCH
      // "Go into the Tasks room. Bring me back any task where my ID
      // is written on the 'creatorId' sticky note OR the 'assigneeId' sticky note."
      OR: [{ creatorId: req.user.id }, { assigneeId: req.user.id }],
    },
    // PRISMA MAGIC: This automatically joins the User table
    // and injects the usernames into your JSON response!

    // STEP 2: THE MAGIC (include)
    // "I found the tasks! But the sticky notes only have numbers on them.
    // Go run back to the Users room, match those numbers to the real users,
    // and bring back their 'username' so the frontend can read it!"
    include: {
      creator: { select: { username: true } },
      assignee: { select: { username: true } },
    },
  });
  res.send(tasks);
});

// get the attachment URL
router.get(
  "/:id/attachments",
  [auth, idValidator, exist(prisma.task)],
  async (req, res, next) => {
    // req.doc is provided by your 'exist' middleware
    const task = req.doc;

    // 1. THE BOUNCER (Authorization)
    // Check if the logged-in user is either the creator or the assignee
    const isCreator = task.creatorId === req.user.id;
    const isAssignee = task.assigneeId === req.user.id;

    if (!isCreator && !isAssignee) {
      return next(
        asAppError({
          status: 403,
          code: "FORBIDDEN",
          message:
            "Access denied. You must be the task creator or assignee to view attachments.",
        }),
      );
    }

    // 2. Ensure an attachment actually exists
    if (!task.creatorAttachment && !task.assigneeAttachment) {
      return next(
        asAppError({
          status: 404,
          code: "ATTACHMENT_NOT_FOUND",
          message: "No attachment found for this task.",
        }),
      );
    }

    try {
      // Example: http://127.0.0.1:9000/bucket-name/12345.pdf -> 12345.pdf
      const bucketName = process.env.S3_BUCKET_NAME;
      const presignedUrls = {};

      // 👉 THE FIX: Bulletproof Helper Function
      // We explicitly check if 'url' exists AND is a string before trying to split it.
      const generateSignedUrl = async (attachmentUrl) => {
        if (!attachmentUrl || typeof attachmentUrl !== "string")
          return undefined;

        // 3. Extract the exact filename from your stored URL
        const urlParts = attachmentUrl.split("/");
        const uniqueFilename = urlParts.pop();
        // 4. Create the instruction for AWS/MinIO
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: uniqueFilename,
        });

        // 5. THE JIT MAGIC
        // Generate a signed URL that expires in 3600 seconds (1 hour)
        // this URL is genereted locally offline with another s3 client that is hardcoded to localhost,
        // because the browser will need to call this URL directly and
        // it won't understand the Docker internal network hostname (minio) that the action client uses.
        // this operation does not involve any network calls to S3/MinIO, it just creates a valid URL format with a signature that the browser can use to download the file directly from S3/MinIO without going through our server, this way we save bandwidth and make downloads faster.
        return await getSignedUrl(presignS3Client, command, {
          expiresIn: 3600,
        });
      };

      // 3. Generate links for whichever files exist
      if (task.creatorAttachment) {
        presignedUrls.creator = await generateSignedUrl(task.creatorAttachment);
      }

      if (task.assigneeAttachment) {
        presignedUrls.assignee = await generateSignedUrl(
          task.assigneeAttachment,
        );
      }

      // 6. Send the temporary VIP pass back to the frontend
      res.json(presignedUrls);
    } catch (err) {
      /**
       * Delegation pattern:
       * - Keep try/catch in S3/MinIO routes (to run cleanup / custom mapping)
       * - Forward a custom AppError to the global error middleware via next()
       */
      return next(
        asAppError({
          status: 500,
          code: "S3_PRESIGN_FAILED",
          message: "Failed to generate secure download link.",
          cause: err,
        }),
      );
    }
  },
);

// create a new task
router.post("/", [auth, validate(tasksValidate)], async (req, res, next) => {
  const { title, status, dueDate, description, priority, assigneeId } =
    req.body;

  const task = await prisma.task.create({
    data: {
      title,
      status,
      description,
      priority,
      creatorId: req.user.id,

      // 2. THE NEW LOGIC
      // If the Professor selected someone from the popup, Prisma links them.
      // If they skipped it, JavaScript passes 'undefined', and Postgres leaves it NULL.
      assigneeId: assigneeId || undefined,

      dueDate: dueDate ? dayjs(dueDate).toDate() : undefined,
    },
  });

  res.send(task);
});

router.patch(
  "/:id",
  [
    auth,
    idValidator,
    exist(prisma.task),
    validate(tasksUpdateValidate),
    authorizeTaskOwner,
  ],
  async (req, res, next) => {
    const { title, status, dueDate, description, priority, assigneeId } =
      req.body;

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        status,
        description,
        priority,
        assigneeId,
        dueDate: dueDate ? dayjs(dueDate).toDate() : undefined,
      },
      // 👉 ADD THIS: Tell Prisma to fetch the nested user data before sending it back!
      include: {
        assignee: {
          select: {
            username: true,
            role: true,
          },
        },
      },
    });

    res.send(updatedTask);
  },
);

router.patch(
  "/:id/resolve",
  [
    auth,
    idValidator,
    exist(prisma.task), // Assuming this attaches the task to req, or we fetch it below
    authorizeTaskOwner,
    upload.single("file"),
    validate(taskResolveValidate),
  ],
  async (req, res, next) => {
    const task = req.doc; // Comes from exist middleware
    const userId = req.user.id;
    const { resolutionNotes } = req.body;

  

    let updateData = {};

    // 1. Initial Validation
    if (!req.file && !resolutionNotes) {
      return next(
        asAppError({
          status: 400,
          code: "NO_ATTACHMENT_OR_NOTES",
          message: "No attachment or resolution notes provided.",
        }),
      );
    }

    // Map the text notes (if any)
    if (task.creatorId === userId) {
      updateData = {
        resolutionNotes:
          resolutionNotes !== undefined
            ? resolutionNotes
            : task.resolutionNotes,
      };
    } else if (task.assigneeId === userId) {
      updateData = {
        resolutionNotes:
          resolutionNotes !== undefined
            ? resolutionNotes
            : task.resolutionNotes,
      };
    } else {
      return next(
        asAppError({
          status: 403,
          code: "FORBIDDEN",
          message: "Unauthorized to resolve this task.",
        }),
      );
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    let uniqueFilename = null;
    let command = null;

    try {
      /**
       * MinIO/S3 upload flow (with rollback):
       * 1) ONLY upload if req.file exists
       * 2) Persist the notes/attachment URL in Postgres via Prisma
       *
       * If step (2) fails after (1) succeeded, we roll back step (1) by deleting
       * the uploaded object so the system does not accumulate orphaned files.
       */

      // 3. Send the file to S3/MinIO (Conditionally)
      if (req.file) {
        const fileExtension = req.file.originalname.split(".").pop();
        uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;

        command = new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueFilename,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        });

        await s3.send(command);

        const fileUrl = `${process.env.S3_ENDPOINT}/${bucketName}/${uniqueFilename}`;

        // Map the URL to the correct column
        if (task.creatorId === userId) updateData.creatorAttachment = fileUrl;
        if (task.assigneeId === userId) updateData.assigneeAttachment = fileUrl;
      }

      // 4. Save to Database
      let updatedTask;
      try {
        updatedTask = await prisma.task.update({
          where: { id: req.params.id },
          data: updateData,
        });
      } catch (dbErr) {
        // Rollback: delete the object we just uploaded (ONLY if we actually uploaded one)
        if (req.file && uniqueFilename) {
          try {
            await s3.send(
              new DeleteObjectCommand({
                Bucket: bucketName,
                Key: uniqueFilename,
              }),
            );
          } catch (rollbackErr) {
            // If rollback fails, keep original DB error as the main cause.
            throw asAppError({
              status: 500,
              code: "S3_UPLOAD_ROLLBACK_FAILED",
              message: "Upload succeeded, but rollback failed after DB error.",
              details: { rollbackError: rollbackErr?.message },
              cause: dbErr,
            });
          }
        }

        // Throw standard DB error if we failed (and successfully rolled back, or had no file)
        throw asAppError({
          status: 500,
          code: "DB_UPDATE_FAILED_AFTER_UPLOAD",
          message: "Failed to save resolution data after upload.",
          cause: dbErr,
        });
      }

      if (command) delete command.Body; // Free up memory

      res.send(updatedTask);
    } catch (err) {
      // If it is already an AppError (like our Rollback error), forward as-is
      return next(
        err?.name === "AppError"
          ? err
          : asAppError({
              status: 500,
              code: "RESOLUTION_FAILED",
              message: "Failed to process ticket resolution.",
              cause: err,
            }),
      );
    }
  },
);

router.delete(
  "/:id",
  [auth, idValidator, exist(prisma.task), authorizeTaskOwner],
  async (req, res, next) => {
    const task = req.doc;

    try {
      const bucketName = process.env.S3_BUCKET_NAME;

      const deleteFromS3 = async (attachmentUrl) => {
        const urlParts = attachmentUrl.split("/");
        const uniqueFileName = urlParts.pop();
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: uniqueFileName,
        });
        await s3.send(command);
      };

      // 1. Delete attachments from S3/MinIO if they exist
      if (task.creatorAttachment) await deleteFromS3(task.creatorAttachment);
      if (task.assigneeAttachment) await deleteFromS3(task.assigneeAttachment);

      const taskToDelete = await prisma.task.delete({
        where: { id: req.params.id },
      });
      res.send({ deleted: taskToDelete });
    } catch (err) {
      return next(
        asAppError({
          status: 500,
          code: "FULL_DELETE_FAILED",
          message: "Failed to securely delete the task and its attachments.",
          cause: err,
        }),
      );
    }
  },
);

router.delete(
  "/:id/attachment",
  [auth, idValidator, exist(prisma.task), authorizeTaskOwner],
  async (req, res, next) => {
    // comes from the exist middleware
    const task = req.doc;
    const userId = req.user.id;

    let attachmentToDeleteUrl = null;
    let dbUpdateData = {};

    if (task.creatorId === userId && task.creatorAttachment) {
      attachmentToDeleteUrl = task.creatorAttachment;
      dbUpdateData.creatorAttachment = null;
      //
    } else if (task.assigneeId === userId && task.assigneeAttachment) {
      attachmentToDeleteUrl = task.assigneeAttachment;
      dbUpdateData.assigneeAttachment = null;
      //
    } else {
      return next(
        asAppError({
          status: 400,
          code: "NO_ATTACHMENT_OR_UNAUTHORIZED",
          message:
            "No attachment found for your role, or you are unauthorized to delete it.",
        }),
      );
    }

    try {
      // 2. Extract just the filename from the URL
      // Example URL: http://127.0.0.1:9000/university-tickets/12345.pdf
      const uniqueFilename = attachmentToDeleteUrl.split("/").pop();
      const bucketName = process.env.S3_BUCKET_NAME;

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: uniqueFilename,
      });

      await s3.send(command);

      const updatedTask = await prisma.task.update({
        where: { id: req.params.id },
        data: dbUpdateData,
      });

      res.send(updatedTask);
    } catch (err) {
      return next(
        asAppError({
          status: 500,
          code: "S3_DELETE_FAILED",
          message: "Failed to delete the file from the storage server.",
          cause: err,
        }),
      );
    }
  },
);

export default router;
