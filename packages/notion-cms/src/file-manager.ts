import { NotionCMSConfig } from "./config";

/**
 * Interface for file information
 */
export interface FileInfo {
  name: string;
  url: string;
  type?: "external" | "file";
  expiry_time?: string;
}

/**
 * File processing strategy interface
 */
export interface FileStrategy {
  processFileUrl(url: string, fileName: string): Promise<string>;
  processFileInfo(fileInfo: FileInfo): Promise<FileInfo>;
}

/**
 * Direct strategy - returns original Notion URLs (current behavior)
 */
export class DirectStrategy implements FileStrategy {
  async processFileUrl(url: string, fileName: string): Promise<string> {
    return url;
  }

  async processFileInfo(fileInfo: FileInfo): Promise<FileInfo> {
    return fileInfo;
  }
}

/**
 * Cache strategy - stores files locally or in S3-compatible storage
 */
export class CacheStrategy implements FileStrategy {
  private config: NotionCMSConfig["files"];

  constructor(config: NotionCMSConfig["files"]) {
    this.config = config;
  }

  async processFileUrl(url: string, fileName: string): Promise<string> {
    // Only handle local storage for now (Phase 2)
    if (this.config?.storage?.type !== "local") {
      // For S3-compatible storage, return original URL until Phase 3
      return url;
    }

    try {
      // Generate stable filename
      const fileId = generateFileId(url);
      const extension = getFileExtension(fileName);
      const stableFileName = `${fileId}${extension}`;
      
      // Get storage path
      const storagePath = this.config.storage.path || "./public/assets/notion-files";
      const fullPath = `${storagePath}/${stableFileName}`;
      
      // Check if file is already cached
      const { fileExists, getFileSize } = await import("./utils/file-utils");
      
      if (await fileExists(fullPath)) {
        // Check TTL if configured
        if (this.config?.cache?.ttl) {
          const fs = await import("fs/promises");
          const stats = await fs.stat(fullPath);
          const age = Date.now() - stats.mtime.getTime();
          
          if (age > this.config.cache.ttl) {
            // File expired, delete and re-download
            await fs.unlink(fullPath);
          } else {
            // File is valid, return cached URL
            return this.generatePublicUrl(storagePath, stableFileName);
          }
        } else {
          // No TTL configured, use cached file
          return this.generatePublicUrl(storagePath, stableFileName);
        }
      }
      
      // Check cache size limits before downloading
      if (this.config?.cache?.maxSize) {
        const { calculateDirSize } = await import("./utils/file-utils");
        const currentSize = await calculateDirSize(storagePath);
        
        if (currentSize > this.config.cache.maxSize) {
          // Clean up old files to make space
          await this.cleanupCache(storagePath);
        }
      }
      
      // Download and cache the file
      const { downloadFile, writeFile } = await import("./utils/file-utils");
      const fileData = await downloadFile(url);
      await writeFile(fullPath, fileData);
      
      return this.generatePublicUrl(storagePath, stableFileName);
      
    } catch (error) {
      console.warn(`Failed to cache file ${fileName}:`, error);
      // Fallback to original URL if caching fails
      return url;
    }
  }

  async processFileInfo(fileInfo: FileInfo): Promise<FileInfo> {
    try {
      const cachedUrl = await this.processFileUrl(fileInfo.url, fileInfo.name);
      
      return {
        ...fileInfo,
        url: cachedUrl,
      };
    } catch (error) {
      console.warn(`Failed to process file info for ${fileInfo.name}:`, error);
      // Return original file info if processing fails
      return fileInfo;
    }
  }

  /**
   * Generate public URL for cached file
   */
  private generatePublicUrl(storagePath: string, fileName: string): string {
    // Convert storage path to public URL
    // Assumes files are stored in public directory
    if (storagePath.startsWith("./public")) {
      return storagePath.replace("./public", "") + "/" + fileName;
    } else if (storagePath.startsWith("public")) {
      return "/" + storagePath.substring(6) + "/" + fileName;
    } else {
      // For non-public paths, return file path (may need framework-specific handling)
      return `/${fileName}`;
    }
  }

  /**
   * Clean up old files to make space in cache
   */
  private async cleanupCache(storagePath: string): Promise<void> {
    if (!this.config?.cache?.ttl) return;
    
    try {
      const { cleanupOldFiles } = await import("./utils/file-utils");
      await cleanupOldFiles(storagePath, this.config.cache.ttl);
    } catch (error) {
      console.warn(`Failed to cleanup cache in ${storagePath}:`, error);
    }
  }
}

/**
 * FileManager class that handles file processing based on strategy
 */
export class FileManager {
  private strategy: FileStrategy;

  constructor(config: NotionCMSConfig) {
    const fileConfig = config.files;
    
    switch (fileConfig?.strategy) {
      case "cache":
        this.strategy = new CacheStrategy(fileConfig);
        break;
      case "direct":
      default:
        this.strategy = new DirectStrategy();
        break;
    }
  }

  /**
   * Process a single file URL
   */
  async processFileUrl(url: string, fileName: string): Promise<string> {
    return this.strategy.processFileUrl(url, fileName);
  }

  /**
   * Process file information object
   */
  async processFileInfo(fileInfo: FileInfo): Promise<FileInfo> {
    return this.strategy.processFileInfo(fileInfo);
  }

  /**
   * Process an array of file information objects
   */
  async processFileInfoArray(files: FileInfo[]): Promise<FileInfo[]> {
    return Promise.all(files.map(file => this.processFileInfo(file)));
  }

  /**
   * Extract file URL from Notion file object
   */
  extractFileUrl(file: any): string {
    if (file.type === "external") {
      return file.external.url;
    } else if (file.type === "file") {
      return file.file.url;
    }
    return "";
  }

  /**
   * Create FileInfo from Notion file object
   */
  createFileInfo(file: any): FileInfo {
    return {
      name: file.name,
      url: this.extractFileUrl(file),
      type: file.type,
      ...(file.type === "file" && { expiry_time: file.file.expiry_time }),
    };
  }
}

/**
 * Utility functions for file processing
 */

/**
 * Generate stable file ID from Notion URL
 */
export function generateFileId(notionUrl: string): string {
  // Extract the file ID from the Notion URL
  // Notion URLs contain unique identifiers we can use
  const match = notionUrl.match(/([a-f0-9-]{36})/);
  if (match) {
    return match[1].replace(/-/g, "").substring(0, 16);
  }
  
  // Fallback: use hash of URL
  let hash = 0;
  for (let i = 0; i < notionUrl.length; i++) {
    const char = notionUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Extract file extension from filename or URL
 */
export function getFileExtension(fileNameOrUrl: string): string {
  const match = fileNameOrUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? `.${match[1]}` : "";
}

/**
 * Detect file type based on extension
 */
export function detectFileType(fileName: string): string {
  const extension = getFileExtension(fileName).toLowerCase();
  
  const imageTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const documentTypes = [".pdf", ".doc", ".docx", ".txt", ".md"];
  const videoTypes = [".mp4", ".mov", ".avi", ".mkv"];
  const audioTypes = [".mp3", ".wav", ".m4a", ".aac"];
  
  if (imageTypes.includes(extension)) return "image";
  if (documentTypes.includes(extension)) return "document";
  if (videoTypes.includes(extension)) return "video";
  if (audioTypes.includes(extension)) return "audio";
  
  return "file";
}