import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// We configure the AWS SDK to point to your local MinIO server instead of Amazon!

// --- S3 CLIENT 1: THE ACTION CLIENT ---
// Uses minio:9000 (Docker internal network)
// Purpose: Actually pushing/deleting files to the server.

// --- S3 CLIENT 2: THE MATH CLIENT ---
// Hardcoded to localhost:9000 (Windows external network)
// Purpose: Offline URL generation ONLY. Creates a valid signature that the browser understands.

// Check if we are running in the AWS Cloud
const isProduction = process.env.NODE_ENV === "production";

// --- S3 CLIENT 1: THE ACTION CLIENT ---
// In Production: Clean AWS setup.
// In Development: Uses internal Docker MinIO (minio:9000)

export const s3 = new S3Client({
  region: process.env.AWS_REGION, // This can be any string, it's not used by MinIO // MinIO requires a region string, even if local

  // If we are NOT in production, inject all the MinIO hacks
  ...(!isProduction && {
    endpoint: process.env.S3_ENDPOINT, // This should be your MinIO server URL, e.g., "http://localhost:9000"
    forcePathStyle: true, // This is required for MinIO to work properl, this force the sdk to put the name of the bucket in the end of the URL instead of the default AWS s3 bucketname.s3.amazonaws.com
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  }),
});

// 2. The Math Client (Hardcoded to localhost for the browser's sake)
export const presignS3Client = isProduction
  ? s3
  : new S3Client({
      region: process.env.AWS_REGION,
      endpoint: "http://localhost:9000", // Force localhost here!
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });
