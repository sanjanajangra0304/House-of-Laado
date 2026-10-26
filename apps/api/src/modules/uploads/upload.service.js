import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../../config/env.js";

// Initialize Cloudinary if credentials are provided in environment
const hasCloudinaryCredentials = Boolean(
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
);

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

/**
 * Upload an image buffer to Cloudinary with fallback to local persistent disk storage
 * @param {Buffer} buffer - File buffer from Multer memory storage
 * @param {Object} options - Custom folder, tags, mimetype, originalname, baseUrl
 * @returns {Promise<{ url: string, publicId: string, format: string, width: number, height: number, bytes: number, isMock: boolean, storage: string }>}
 */
export async function uploadImageToCloudinary(buffer, options = {}) {
  const folder = options.folder || "house_of_laado/products";

  if (!hasCloudinaryCredentials) {
    // Graceful persistent local disk storage for development, testing, and self-hosted mode
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Determine clean extension
    let ext = "jpg";
    if (options.mimetype) {
      const parts = options.mimetype.split("/");
      if (parts[1]) {
        ext = parts[1].toLowerCase().replace("jpeg", "jpg").replace("x-png", "png");
      }
    } else if (options.originalname) {
      const match = options.originalname.match(/\.([a-z0-9]+)$/i);
      if (match) {
        ext = match[1].toLowerCase().replace("jpeg", "jpg");
      }
    }

    const uniqueId = `garment_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const filename = `${uniqueId}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    // Save actual file buffer to disk
    fs.writeFileSync(filePath, buffer);

    const baseUrl = options.baseUrl || "http://localhost:5000";
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    return {
      url: fileUrl,
      publicId: uniqueId,
      format: ext,
      width: 1200,
      height: 1600,
      bytes: buffer.length,
      isMock: false,
      storage: "local",
      message: "Uploaded to local media server. For cloud CDN, provide CLOUDINARY_* environment keys.",
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1600, height: 2133, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url || result.url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          isMock: false,
          storage: "cloudinary",
        });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}
