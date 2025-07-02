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
 * Note: Implementation will be added in Phase 2
 */
export class CacheStrategy implements FileStrategy {
  private config: NotionCMSConfig["files"];

  constructor(config: NotionCMSConfig["files"]) {
    this.config = config;
  }

  async processFileUrl(url: string, fileName: string): Promise<string> {
    // TODO: Implement in Phase 2 - Cache Strategy (Local Storage)
    // For now, return original URL to maintain backward compatibility
    return url;
  }

  async processFileInfo(fileInfo: FileInfo): Promise<FileInfo> {
    // TODO: Implement in Phase 2 - Cache Strategy (Local Storage)
    // For now, return original file info
    return fileInfo;
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