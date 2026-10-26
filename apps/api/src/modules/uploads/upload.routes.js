import { Router } from "express";
import multer from "multer";
import * as uploadController from "./upload.controller.js";
import { authenticate, requireStaff } from "../../middleware/auth.js";

const router = Router();

// Configure Multer with Memory Storage & 15MB Limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for high-res smartphone/DSLR photos
  },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    const isImageMime = mime.startsWith("image/");
    const isAllowedExt = /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.originalname || "");
    if (isImageMime || isAllowedExt) {
      cb(null, true);
    } else {
      const err = new Error("Invalid file type. Only JPEG, PNG, WebP, GIF, and modern image formats are allowed.");
      err.code = "INVALID_FILE_TYPE";
      err.status = 400;
      cb(err, false);
    }
  },
});

function handleMulterErrors(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: {
              code: "FILE_TOO_LARGE",
              message: "File exceeds maximum permitted size of 15 MB.",
            },
          });
        }
        return res.status(400).json({
          success: false,
          error: {
            code: "UPLOAD_ERROR",
            message: err.message,
          },
        });
      } else if (err) {
        return res.status(err.status || 400).json({
          success: false,
          error: {
            code: err.code || "UPLOAD_ERROR",
            message: err.message,
          },
        });
      }
      next();
    });
  };
}

/**
 * POST /api/v1/uploads/image
 * Accessible to Staff, Admin, and Owner
 */
router.post(
  "/image",
  authenticate,
  requireStaff,
  handleMulterErrors(upload.single("image")),
  uploadController.uploadImage
);

router.post(
  "/",
  authenticate,
  requireStaff,
  handleMulterErrors(upload.single("image")),
  uploadController.uploadImage
);

/**
 * POST /api/v1/uploads/multiple
 * Accessible to Staff, Admin, and Owner
 */
router.post(
  "/multiple",
  authenticate,
  requireStaff,
  handleMulterErrors(upload.array("images", 10)),
  uploadController.uploadMultipleImages
);

export default router;
