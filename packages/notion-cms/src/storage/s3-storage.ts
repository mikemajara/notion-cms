/**
 * S3-compatible storage interface for file caching
 * Supports AWS S3, Vercel Blob, and other S3-compatible services
 */

export interface S3Config {
  endpoint: string;
  bucket: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
}

export interface StorageInterface {
  exists(fileName: string): Promise<boolean>;
  store(fileName: string, data: Buffer): Promise<void>;
  getPublicUrl(fileName: string): string;
  delete(fileName: string): Promise<void>;
  listFiles(): Promise<string[]>;
  getFileSize(fileName: string): Promise<number>;
}

/**
 * Helper to safely import AWS SDK
 */
async function importAwsS3(): Promise<any> {
  try {
    // Using require with eval to avoid TypeScript compile-time errors
    const requireFunc = eval("require");
    return requireFunc("@aws-sdk/client-s3");
  } catch (error) {
    throw new Error(
      "AWS SDK is required for S3-compatible storage. Install: npm install @aws-sdk/client-s3"
    );
  }
}

/**
 * S3-compatible storage implementation
 */
export class S3Storage implements StorageInterface {
  private config: S3Config;
  private s3Client: any;

  constructor(config: S3Config) {
    this.config = config;
    // Don't initialize client immediately - wait until it's actually needed
  }

  /**
   * Initialize S3 client (lazy loading to avoid requiring AWS SDK when not needed)
   */
  private async initializeS3Client() {
    if (this.s3Client) return;

    try {
      const awsS3 = await importAwsS3();
      const { S3Client } = awsS3;

      const clientConfig: any = {
        region: this.config.region || "us-east-1",
      };

      // Handle custom endpoints (for Vercel Blob, MinIO, etc.)
      if (
        this.config.endpoint &&
        !this.config.endpoint.includes("amazonaws.com")
      ) {
        clientConfig.endpoint = this.config.endpoint;
        clientConfig.forcePathStyle = true;
      }

      // Add credentials if provided
      if (this.config.accessKey && this.config.secretKey) {
        clientConfig.credentials = {
          accessKeyId: this.config.accessKey,
          secretAccessKey: this.config.secretKey,
        };
      }

      this.s3Client = new S3Client(clientConfig);
    } catch (error) {
      console.warn(
        "AWS SDK not found. Install @aws-sdk/client-s3 for S3-compatible storage:",
        error
      );
      throw error;
    }
  }

  /**
   * Check if a file exists in S3
   */
  async exists(fileName: string): Promise<boolean> {
    try {
      await this.initializeS3Client();
      const awsS3 = await importAwsS3();
      const { HeadObjectCommand } = awsS3;

      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: fileName,
        })
      );

      return true;
    } catch (error: any) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Store a file in S3
   */
  async store(fileName: string, data: Buffer): Promise<void> {
    try {
      await this.initializeS3Client();
      const awsS3 = await importAwsS3();
      const { PutObjectCommand } = awsS3;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: fileName,
          Body: data,
          ContentType: this.getContentType(fileName),
        })
      );
    } catch (error) {
      console.error(`Failed to store file ${fileName} in S3:`, error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(fileName: string): string {
    const { endpoint, bucket, region } = this.config;

    // Validate bucket
    if (!bucket || typeof bucket !== "string" || bucket.trim() === "") {
      throw new Error(
        "S3Storage: Bucket name is missing or invalid in config."
      );
    }

    // If endpoint is missing or empty, fallback to AWS S3 default
    if (!endpoint || typeof endpoint !== "string" || endpoint.trim() === "") {
      const awsRegion = region || "us-east-1";
      return `https://${bucket}.s3.${awsRegion}.amazonaws.com/${encodeURIComponent(
        fileName
      )}`;
    }

    // If endpoint is AWS S3
    if (endpoint.includes("amazonaws.com")) {
      const awsRegion = region || "us-east-1";
      return `https://${bucket}.s3.${awsRegion}.amazonaws.com/${encodeURIComponent(
        fileName
      )}`;
    }

    // For custom endpoints (Vercel Blob, MinIO, etc.)
    // Remove trailing slashes from endpoint and bucket
    const cleanEndpoint = endpoint.replace(/\/+$/, "");
    const cleanBucket = bucket.replace(/\/+$/, "");
    // Remove leading slashes from fileName
    const cleanFileName = fileName.replace(/^\/+/, "");
    return `${cleanEndpoint}/${cleanBucket}/${encodeURIComponent(
      cleanFileName
    )}`;
  }

  /**
   * Delete a file from S3
   */
  async delete(fileName: string): Promise<void> {
    try {
      await this.initializeS3Client();
      const awsS3 = await importAwsS3();
      const { DeleteObjectCommand } = awsS3;

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: fileName,
        })
      );
    } catch (error) {
      console.error(`Failed to delete file ${fileName} from S3:`, error);
      throw error;
    }
  }

  /**
   * List all files in the bucket
   */
  async listFiles(): Promise<string[]> {
    try {
      await this.initializeS3Client();
      const awsS3 = await importAwsS3();
      const { ListObjectsV2Command } = awsS3;

      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
        })
      );

      // Only return valid keys, skip objects without a Key property
      return (response.Contents || [])
        .filter((obj: any) => typeof obj.Key === "string" && obj.Key.length > 0)
        .map((obj: any) => obj.Key);
    } catch (error) {
      console.error("Failed to list files from S3:", error);
      throw error;
    }
  }

  /**
   * Get file size in bytes
   */
  async getFileSize(fileName: string): Promise<number> {
    try {
      await this.initializeS3Client();
      const awsS3 = await importAwsS3();
      const { HeadObjectCommand } = awsS3;

      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: fileName,
        })
      );

      return response.ContentLength || 0;
    } catch (error) {
      console.error(`Failed to get file size for ${fileName}:`, error);
      return 0;
    }
  }

  /**
   * Get appropriate content type for file
   */
  private getContentType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      mp4: "video/mp4",
      mov: "video/quicktime",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      zip: "application/zip",
      txt: "text/plain",
      md: "text/markdown",
    };

    return contentTypes[extension || ""] || "application/octet-stream";
  }
}

/**
 * Local storage implementation for comparison
 */
export class LocalStorage implements StorageInterface {
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
  }

  async exists(fileName: string): Promise<boolean> {
    const { fileExists } = await import("../utils/file-utils");
    const fullPath = `${this.storagePath}/${fileName}`;
    return fileExists(fullPath);
  }

  async store(fileName: string, data: Buffer): Promise<void> {
    const { writeFile } = await import("../utils/file-utils");
    const fullPath = `${this.storagePath}/${fileName}`;
    await writeFile(fullPath, data);
  }

  getPublicUrl(fileName: string): string {
    // Convert storage path to public URL
    let basePath = this.storagePath;
    if (basePath.startsWith("./public")) {
      basePath = basePath.replace(/^\.\/public\/?/, "");
    } else if (basePath.startsWith("public")) {
      basePath = basePath.replace(/^public\/?/, "");
    }
    // Remove any leading/trailing slashes from basePath and fileName
    basePath = basePath.replace(/^\/+|\/+$/g, "");
    const cleanFileName = fileName.replace(/^\/+/, "");
    // Only prepend slash if basePath is not empty
    return basePath ? `/${basePath}/${cleanFileName}` : `/${cleanFileName}`;
  }

  async delete(fileName: string): Promise<void> {
    try {
      const fs = await import("fs/promises");
      const fullPath = `${this.storagePath}/${fileName}`;
      await fs.unlink(fullPath);
    } catch (error) {
      console.warn(`Failed to delete file ${fileName}:`, error);
    }
  }

  async listFiles(): Promise<string[]> {
    try {
      const fs = await import("fs/promises");
      const entries = await fs.readdir(this.storagePath, {
        withFileTypes: true,
      });
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
    } catch (error) {
      console.warn(`Failed to list files in ${this.storagePath}:`, error);
      return [];
    }
  }

  async getFileSize(fileName: string): Promise<number> {
    const { getFileSize } = await import("../utils/file-utils");
    const fullPath = `${this.storagePath}/${fileName}`;
    return getFileSize(fullPath);
  }
}
