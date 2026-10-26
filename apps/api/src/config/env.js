import dotenv from "dotenv";
import Joi from "joi";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Support MongoDB Atlas credentials if explicitly configured in an external file
if (process.env.ATLAS_CREDENTIALS_PATH && fs.existsSync(process.env.ATLAS_CREDENTIALS_PATH)) {
  dotenv.config({ path: process.env.ATLAS_CREDENTIALS_PATH, override: true });
}

// Support aliases for MONGODB_URI if user set MONGODB_ATLAS_URI or MONGO_URI
if (!process.env.MONGODB_URI && process.env.MONGODB_ATLAS_URI) {
  process.env.MONGODB_URI = process.env.MONGODB_ATLAS_URI;
} else if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
  process.env.MONGODB_URI = process.env.MONGO_URI;
}

const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  CLIENT_URL: Joi.string().uri().default("http://localhost:3000"),
  MONGODB_URI: Joi.string().required().description("MongoDB connection URI"),
  JWT_SECRET: Joi.string().min(16).required().description("JWT Signing Secret"),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  ADMIN_EMAIL: Joi.string().email().default("admin@store.com"),
  ADMIN_PASSWORD: Joi.string().min(8).allow("").default(""),
  RAZORPAY_KEY_ID: Joi.string().allow("").default(""),
  RAZORPAY_KEY_SECRET: Joi.string().allow("").default(""),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().allow("").default(""),
  RESEND_API_KEY: Joi.string().allow("").default(""),
  EMAIL_FROM: Joi.string().default("House of Laado <orders@houseoflaado.com>"),
  FRONTEND_URL: Joi.string().allow("").default("http://localhost:3000"),
  BACKEND_URL: Joi.string().allow("").default("http://localhost:5000"),
  SMTP_HOST: Joi.string().allow("").default(""),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow("").default(""),
  SMTP_PASS: Joi.string().allow("").default(""),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow("").default(""),
  CLOUDINARY_API_KEY: Joi.string().allow("").default(""),
  CLOUDINARY_API_SECRET: Joi.string().allow("").default(""),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  throw new Error(`Environment validation failed: ${error.details.map((x) => x.message).join(", ")}`);
}

export const env = {
  port: envVars.PORT,
  nodeEnv: envVars.NODE_ENV,
  clientUrl: envVars.CLIENT_URL,
  mongodbUri: envVars.MONGODB_URI,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,
  adminEmail: envVars.ADMIN_EMAIL,
  adminPassword: envVars.ADMIN_PASSWORD,
  razorpayKeyId: envVars.RAZORPAY_KEY_ID,
  razorpayKeySecret: envVars.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: envVars.RAZORPAY_WEBHOOK_SECRET,
  resendApiKey: envVars.RESEND_API_KEY,
  emailFrom: envVars.EMAIL_FROM,
  frontendUrl: envVars.FRONTEND_URL || envVars.CLIENT_URL,
  backendUrl: envVars.BACKEND_URL,
  smtpHost: envVars.SMTP_HOST,
  smtpPort: envVars.SMTP_PORT,
  smtpUser: envVars.SMTP_USER,
  smtpPass: envVars.SMTP_PASS,
  cloudinaryCloudName: envVars.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: envVars.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: envVars.CLOUDINARY_API_SECRET,
};
