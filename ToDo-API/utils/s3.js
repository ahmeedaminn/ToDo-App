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



export const s3 = new S3Client({
  region: "us-east-1", // This can be any string, it's not used by MinIO // MinIO requires a region string, even if local
  endpoint: process.env.S3_ENDPOINT, // This should be your MinIO server URL, e.g., "http://localhost:9000"
  forcePathStyle: true, // This is required for MinIO to work properl, this force the sdk to put the name of the bucket in the end of the URL instead of the default AWS s3 bucketname.s3.amazonaws.com
  credentials: {
    /**
     * IMPORTANT:
     * Never hardcode credentials in source code.
     * For local dev with Docker Compose, these map to your MinIO container's root keys.
     */
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});


// 2. The Math Client (Hardcoded to localhost for the browser's sake)
export const presignS3Client = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:9000", // Force localhost here!
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});