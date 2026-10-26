import { uploadImageToCloudinary } from "./upload.service.js";

/**
 * Handle Single Image Upload
 */
export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "No image file provided in request. Field name must be 'image'.",
        },
      });
    }

    const folder = req.body.folder || "house_of_laado/products";
    const host = req.get("host") || "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const baseUrl = `${protocol}://${host}`;

    const result = await uploadImageToCloudinary(req.file.buffer, {
      folder,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      baseUrl,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Handle Multiple Images Upload
 */
export async function uploadMultipleImages(req, res, next) {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "No image files provided in request. Field name must be 'images'.",
        },
      });
    }

    const folder = req.body.folder || "house_of_laado/products";
    const host = req.get("host") || "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const baseUrl = `${protocol}://${host}`;

    const uploadPromises = files.map((file) =>
      uploadImageToCloudinary(file.buffer, {
        folder,
        mimetype: file.mimetype,
        originalname: file.originalname,
        baseUrl,
      })
    );

    const results = await Promise.all(uploadPromises);

    return res.status(201).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}
