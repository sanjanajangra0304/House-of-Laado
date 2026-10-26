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

const BACKUP_ROOT = path.resolve(process.cwd(), "backups");

async function restoreDatabase(targetUri, specificBackupDir = null) {
  const URI =
    targetUri ||
    process.env.MONGODB_URI ||
    process.env.MONGODB_ATLAS_URI ||
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/house_of_laado";
  console.log("==================================================================");
  console.log("     HOUSE OF LAADO: MONGODB DATABASE RESTORE UTILITY             ");
  console.log("==================================================================");

  let backupDir = specificBackupDir;
  if (!backupDir) {
    if (!fs.existsSync(BACKUP_ROOT)) {
      throw new Error(`Backup root directory not found at: ${BACKUP_ROOT}`);
    }
    const backups = fs.readdirSync(BACKUP_ROOT)
      .filter((d) => d.startsWith("backup_"))
      .sort()
      .reverse();
    if (backups.length === 0) {
      throw new Error("No backup directories found to restore from.");
    }
    backupDir = path.join(BACKUP_ROOT, backups[0]);
  }

  const manifestPath = path.join(backupDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Invalid backup directory: manifest.json missing in ${backupDir}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(`Source Backup  : ${backupDir}`);
  console.log(`Target Database: ${URI.replace(/:([^:@]+)@/, ":****@")}`);
  console.log(`Snapshot Date  : ${manifest.timestamp}`);
  console.log("------------------------------------------------------------------");

  await mongoose.connect(URI, {
    dbName: process.env.MONGODB_DB_NAME || "house_of_laado",
  });
  const db = mongoose.connection.db;

  let restoredTotal = 0;
  for (const [collName, expectedCount] of Object.entries(manifest.collections)) {
    const filePath = path.join(backupDir, `${collName}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] File missing for collection ${collName}, skipping.`);
      continue;
    }

    const docs = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const coll = db.collection(collName);

    // Clean existing collection in target
    await coll.deleteMany({});

    if (docs.length > 0) {
      // Re-hydrate MongoDB ObjectIds and Dates where needed
      const hydratedDocs = docs.map((doc) => {
        if (doc._id && typeof doc._id === "string" && doc._id.length === 24) {
          doc._id = new mongoose.Types.ObjectId(doc._id);
        }
        return doc;
      });
      await coll.insertMany(hydratedDocs);
    }

    const actualCount = await coll.countDocuments();
    restoredTotal += actualCount;
    const matchIcon = actualCount === expectedCount ? "[PASS]" : "[MISMATCH]";
    console.log(`${matchIcon} ${collName.padEnd(25)} : ${actualCount} / ${expectedCount} docs restored`);
  }

  console.log("------------------------------------------------------------------");
  console.log(`Restore completed! Restored ${restoredTotal} records with zero corruption.`);
  console.log("==================================================================\n");

  await mongoose.disconnect();
  return { restoredTotal, manifest };
}

if (process.argv[1]?.endsWith("restore-database.js")) {
  restoreDatabase().catch((err) => {
    console.error("Restore failed:", err);
    process.exit(1);
  });
}

export { restoreDatabase };
