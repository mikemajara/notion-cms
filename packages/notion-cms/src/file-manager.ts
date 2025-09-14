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
}

/**
 * Direct strategy - returns original Notion URLs (current behavior)
 */
export class DirectStrategy implements FileStrategy {
  async processFileUrl(url: string, _fileName: string): Promise<string> {
    return url;
  }
}

/**
 * Local strategy - stores files locally
 */
export class LocalStrategy implements FileStrategy {
  private config: NotionCMSConfig["files"];

  constructor(config: NotionCMSConfig["files"]) {
    this.config = config;
  }

  async processFileUrl(url: string, fileName: string): Promise<string> {
    try {
      // Generate stable filename
      const fileId = generateFileId(url);
      const extension = getFileExtension(fileName);
      const stableFileName = `${fileId}${extension}`;

      // Create local storage
      const storage = await this.createStorage();

      // Check if file is already cached
      if (await storage.exists(stableFileName)) {
        return storage.getPublicUrl(stableFileName);
      }

      // Download and cache the file
      const { downloadFile } = await import("./utils/file-utils");
      const fileData = await downloadFile(url);
      await storage.store(stableFileName, fileData);

      return storage.getPublicUrl(stableFileName);
    } catch (error) {
      console.warn(`Failed to cache file locally: ${fileName} from ${url}`, {
        fileName,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return url;
    }
  }

  private async createStorage(): Promise<any> {
    const { LocalStorage } = await import("./storage/s3-storage");
    const storagePath = this.config?.storage?.path || "./public/assets/notion-files";
    return new LocalStorage(storagePath);
  }
}

/**
 * Remote strategy - stores files in S3-compatible storage
 */
export class RemoteStrategy implements FileStrategy {
  private config: NotionCMSConfig["files"];

  constructor(config: NotionCMSConfig["files"]) {
    this.config = config;
  }

  async processFileUrl(url: string, fileName: string): Promise<string> {
    if (!this.config?.storage) {
      return url;
    }

    try {
      // Generate stable filename with bucket prefix
      const fileId = generateFileId(url);
      const extension = getFileExtension(fileName);
      const bucketPath = this.config.storage.path || "";
      const stableFileName = bucketPath ? `${bucketPath}${fileId}${extension}` : `${fileId}${extension}`;

      // Create S3 storage
      const storage = await this.createStorage();

      // Check if file is already in S3
      if (await storage.exists(stableFileName)) {
        return storage.getPublicUrl(stableFileName);
      }

      // Download and store in S3
      const { downloadFile } = await import("./utils/file-utils");
      const fileData = await downloadFile(url);
      await storage.store(stableFileName, fileData);

      return storage.getPublicUrl(stableFileName);
    } catch (error) {
      console.warn(`Failed to store file remotely: ${fileName} from ${url}`, {
        fileName,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return url;
    }
  }

  private async createStorage(): Promise<any> {
    if (!this.config?.storage) {
      throw new Error("S3 storage configuration is required for remote strategy");
    }

    const { S3Storage } = await import("./storage/s3-storage");
    return new S3Storage({
      endpoint: this.config.storage.endpoint,
      bucket: this.config.storage.bucket || "default-bucket",
      accessKey: this.config.storage.accessKey,
      secretKey: this.config.storage.secretKey,
      region: this.config.storage.region,
    });
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
      case "local":
        this.strategy = new LocalStrategy(fileConfig);
        break;
      case "remote":
        this.strategy = new RemoteStrategy(fileConfig);
        break;
      case "direct":
      default:
        this.strategy = new DirectStrategy();
        break;
    }
  }

  /**
   * Check if file caching is enabled
   */
  isCacheEnabled(): boolean {
    return this.strategy instanceof LocalStrategy || this.strategy instanceof RemoteStrategy;
  }

  /**
   * Process a single file URL
   */
  async processFileUrl(url: string, fileName: string): Promise<string> {
    return this.strategy.processFileUrl(url, fileName);
  }

  /**
   * Process an array of file information objects
   */
  async processFileInfoArray(files: FileInfo[]): Promise<FileInfo[]> {
    return Promise.all(
      files.map(async (file) => {
        const processedUrl = await this.processFileUrl(file.url, file.name);
        return {
          ...file,
          url: processedUrl,
        };
      })
    );
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
  // Notion URLs have structure: https://.../workspace-id/file-id/filename
  // We want the second UUID (file-id), not the first (workspace-id)
  const matches = notionUrl.match(/([a-f0-9-]{36})/g);

  if (matches && matches.length >= 2) {
    // Use the second UUID as the file identifier
    const fileId = matches[1].replace(/-/g, "");
    return fileId;
  } else if (matches && matches.length === 1) {
    // Fallback to first UUID if only one exists
    const fileId = matches[0].replace(/-/g, "");
    return fileId;
  }

  // Fallback: use hash of URL
  let hash = 0;
  for (let i = 0; i < notionUrl.length; i++) {
    const char = notionUrl.charCodeAt(i);
    hash = (hash << 5) - hash + char;
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
