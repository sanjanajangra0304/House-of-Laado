import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connect to MongoDB database
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 4000,
      dbName: process.env.MONGODB_DB_NAME || "vastra_store",
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.warn(`[Database Warning] Primary connection failed: ${err.message}. Attempting local fallback...`);
    try {
      const fallbackUri = process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/vastra_store";
      const conn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`[Database] Connected to local fallback database: ${conn.connection.host} (DB: ${conn.connection.name})`);
      return conn;
    } catch (fallbackErr) {
      console.error(`[Database Error] Failed to connect to MongoDB: ${fallbackErr.message}`);
      if (env.nodeEnv === "production") {
        process.exit(1);
      }
      throw fallbackErr;
    }
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("[Database] MongoDB disconnected cleanly.");
  }
}

/**
 * Get DB health state string
 */
export function getDBStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
}

/**
 * Get detailed DB health status (without exposing secrets)
 */
export function getDBDetails() {
  return {
    status: getDBStatus(),
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
    readyState: mongoose.connection.readyState,
  };
}
