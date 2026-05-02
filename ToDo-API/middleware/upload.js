import multer from "multer";
import { asAppError } from "../utils/appError.js";

// 1. We specifically tell multer to use "Memory Storage".
// This means: "Do not save it to the hard drive, just hold it in the RAM!"
const storage = multer.memoryStorage();

export const upload = multer({
  // we create the middle, we add safety limit so nobody can upload a 5GB file and crash our server
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
  fileFilter: (req, file, cb) => {
    // 1. Check if it is a PDF
    // MIME => Multipurpose Internet Mail Extensions.
    // category/specific-format
    const isPdf = file.mimetype === "application/pdf";

    // 2. Check if it is ANY valid image type
    const isImage = file.mimetype.startsWith("image/");

    // 2. Check for Word Documents (.doc and .docx)
    const isOldWord = file.mimetype === "application/msword";
    const isNewWord =
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // 3. The Gatekeeper Decision
    if (isPdf || isImage || isOldWord || isNewWord) {
      cb(null, true); // Accept the file!
    } else {
      /**
       * Standardized error:
       * Multer errors flow through Express' error pipeline. By passing an AppError here,
       * the global `errorMiddleware` can return a consistent 400 response shape.
       */
      cb(
        asAppError({
          status: 400,
          code: "INVALID_FILE_TYPE",
          message: "Only images, PDFs, and Word documents are allowed!",
          details: { mimetype: file.mimetype },
        }),
        false,
      );
    }
  },
});
