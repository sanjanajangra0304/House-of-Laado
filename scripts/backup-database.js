import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "apps/api/.env") });

// Support MongoDB Atlas credentials if stored in atlas-credentials.env or via aliases
const atlasDownloadsPath = "C:/Users/sanja/Downloads/atlas-credentials.env";
if (
  (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("localhost")) &&
  fs.existsSync(atlasDownloadsPath)
) {
  dotenv.config({ path: atlasDownloadsPath, override: true });
}

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/house_of_laado";
const BACKUP_ROOT = path.resolve(process.cwd(), "backups");

async function backupDatabase() {
  console.log("==================================================================");
  console.log("     HOUSE OF LAADO: MONGODB DATABASE SNAPSHOT UTILITY            ");
  console.log("==================================================================");
  console.log(`Connecting to: ${MONGO_URI.replace(/:([^:@]+)@/, ":****@")}`);

  await mongoose.connect(MONGO_URI, {
    dbName: process.env.MONGODB_DB_NAME || "house_of_laado",
  });
  const db = mongoose.connection.db;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(BACKUP_ROOT, `backup_${timestamp}`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = await db.listCollections().toArray();
  const manifest = {
    timestamp: new Date().toISOString(),
    database: db.databaseName,
    collections: {},
    totalDocuments: 0,
  };

  for (const collInfo of collections) {
    const collName = collInfo.name;
    // Skip system and temporary collections
    if (collName.startsWith("system.")) continue;

    const coll = db.collection(collName);
    const docs = await coll.find({}).toArray();
    const filePath = path.join(backupDir, `${collName}.json`);

    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf8");
    manifest.collections[collName] = docs.length;
    manifest.totalDocuments += docs.length;
    console.log(`[DUMP] ${collName.padEnd(25)} : ${docs.length} documents -> ${collName}.json`);
  }

  fs.writeFileSync(path.join(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log("------------------------------------------------------------------");
  console.log(`Snapshot completed successfully!`);
  console.log(`Directory : ${backupDir}`);
  console.log(`Documents : ${manifest.totalDocuments} total records across ${Object.keys(manifest.collections).length} collections.`);
  console.log("==================================================================\n");

  await mongoose.disconnect();
  return { backupDir, manifest };
}

if (process.argv[1]?.endsWith("backup-database.js")) {
  backupDatabase().catch((err) => {
    console.error("Backup failed:", err);
    process.exit(1);
  });
}

export { backupDatabase };
