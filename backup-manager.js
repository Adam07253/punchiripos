// Cloudflare R2 Database Backup System
// Production Ready Implementation

const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const cron = require("node-cron");
require("dotenv").config();

// Initialize R2 Client
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Ensure backup folder exists
const backupFolder = process.env.BACKUP_FOLDER || "backups";
if (!fs.existsSync(backupFolder)) {
  fs.mkdirSync(backupFolder, { recursive: true });
}

/**
 * Get the next available number for divClose backups today
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {number} - Next available number
 */
function getNextCloseNumber(dateStr) {
  // Read all files in backup folder
  const files = fs.readdirSync(backupFolder);
  
  // Pattern: storedb_YYYY-MM-DD_divClose_<n>.db
  const pattern = new RegExp(`^storedb_${dateStr}_divClose_(\\d+)\\.db$`);
  
  // Find all matching files and extract numbers
  const numbers = files
    .map(file => {
      const match = file.match(pattern);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(num => num !== null);
  
  // Return next number (max + 1, or 1 if none exist)
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}

/**
 * Generate backup filename with proper naming convention
 * @param {string} type - "divOpen" or "divClose"
 * @returns {string} - Formatted filename
 */
function generateBackupFilename(type) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  
  if (type === "divClose") {
    // For closing backups, add sequential number
    const nextNumber = getNextCloseNumber(dateStr);
    return `storedb_${dateStr}_divClose_${nextNumber}.db`;
  } else {
    // For opening backups, keep original format
    return `storedb_${dateStr}_${type}.db`;
  }
}

/**
 * Generate R2 storage key with organized structure
 * @param {string} filename - Backup filename
 * @returns {string} - R2 storage key
 */
function generateR2Key(filename) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  
  return `${year}/${month}/${filename}`;
}

/**
 * Create a safe copy of the database
 * @param {string} dbPath - Path to live database
 * @param {string} type - "divOpen" or "divClose"
 * @returns {Promise<string>} - Path to backup file
 */
async function createDatabaseCopy(dbPath, type) {
  return new Promise((resolve, reject) => {
    const filename = generateBackupFilename(type);
    const backupPath = path.join(backupFolder, filename);
    
    // Create a safe copy of the database
    const readStream = fs.createReadStream(dbPath);
    const writeStream = fs.createWriteStream(backupPath);
    
    readStream.on("error", reject);
    writeStream.on("error", reject);
    writeStream.on("finish", () => resolve(backupPath));
    
    readStream.pipe(writeStream);
  });
}

/**
 * Upload backup file to Cloudflare R2
 * @param {string} filePath - Local backup file path
 * @returns {Promise<object>} - Upload result
 */
async function uploadToR2(filePath) {
  const filename = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);
  const r2Key = generateR2Key(filename);
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
    Body: fileContent,
    ContentType: "application/x-sqlite3",
  });
  
  const result = await r2Client.send(command);
  return { success: true, key: r2Key, result };
}

/**
 * Perform complete backup process
 * @param {string} dbPath - Path to live database
 * @param {string} type - "divOpen" or "divClose"
 * @returns {Promise<object>} - Backup result
 */
async function performBackup(dbPath, type) {
  try {
    console.log(`[Backup] Starting ${type} backup...`);
    
    // Step 1: Create safe database copy
    const backupPath = await createDatabaseCopy(dbPath, type);
    console.log(`[Backup] Database copied to: ${backupPath}`);
    
    // Step 2: Upload to Cloudflare R2
    const uploadResult = await uploadToR2(backupPath);
    console.log(`[Backup] Uploaded to R2: ${uploadResult.key}`);
    
    return {
      success: true,
      message: "Backup uploaded successfully",
      filename: path.basename(backupPath),
      r2Key: uploadResult.key,
    };
  } catch (error) {
    console.error(`[Backup] Error during ${type} backup:`, error);
    return {
      success: false,
      message: "Backup failed",
      error: error.message,
    };
  }
}

/**
 * Schedule automatic backup at 12 PM
 * @param {string} dbPath - Path to live database
 */
function scheduleAutomaticBackup(dbPath) {
  const cronExpression = process.env.BACKUP_TIME_CRON || "0 12 * * *";
  
  cron.schedule(cronExpression, async () => {
    console.log("[Backup] Running scheduled automatic backup (12 PM)...");
    const result = await performBackup(dbPath, "divOpen");
    
    if (result.success) {
      console.log("[Backup] Automatic backup completed successfully");
    } else {
      console.error("[Backup] Automatic backup failed:", result.error);
    }
  });
  
  console.log(`[Backup] Automatic backup scheduled: ${cronExpression}`);
}

/**
 * Perform manual store closing backup
 * @param {string} dbPath - Path to live database
 * @returns {Promise<object>} - Backup result
 */
async function performStoreClosingBackup(dbPath) {
  console.log("[Backup] Manual store closing backup requested...");
  return await performBackup(dbPath, "divClose");
}

module.exports = {
  scheduleAutomaticBackup,
  performStoreClosingBackup,
};
