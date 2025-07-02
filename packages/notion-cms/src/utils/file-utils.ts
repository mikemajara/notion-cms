/**
 * Utility functions for file operations
 */

/**
 * Download a file from a URL
 * @param url The URL to download from
 * @returns Promise resolving to the file data as Buffer
 */
export async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if a file exists at the given path
 * @param filePath Path to check
 * @returns Promise resolving to boolean
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 * @param dirPath Directory path to ensure
 */
export async function ensureDir(dirPath: string): Promise<void> {
  const fs = await import("fs/promises");
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    // Ignore error if directory already exists
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

/**
 * Write file data to disk
 * @param filePath Path to write to
 * @param data Data to write
 */
export async function writeFile(filePath: string, data: Buffer): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  
  // Ensure the directory exists
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  
  // Write the file
  await fs.writeFile(filePath, data);
}

/**
 * Get file size in bytes
 * @param filePath Path to the file
 * @returns File size in bytes, or 0 if file doesn't exist
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const fs = await import("fs/promises");
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Calculate cache directory size
 * @param dirPath Directory to calculate size for
 * @returns Total size in bytes
 */
export async function calculateDirSize(dirPath: string): Promise<number> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    
    let totalSize = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      } else if (entry.isDirectory()) {
        totalSize += await calculateDirSize(fullPath);
      }
    }
    
    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Clean up old files in cache directory based on TTL
 * @param dirPath Directory to clean
 * @param ttl Time to live in milliseconds
 */
export async function cleanupOldFiles(dirPath: string, ttl: number): Promise<void> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    
    const now = Date.now();
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.join(dirPath, entry.name);
        const stats = await fs.stat(fullPath);
        const age = now - stats.mtime.getTime();
        
        if (age > ttl) {
          await fs.unlink(fullPath);
        }
      }
    }
  } catch (error) {
    // Silently ignore cleanup errors
    console.warn(`Failed to cleanup old files in ${dirPath}:`, error);
  }
}