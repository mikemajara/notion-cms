import { NotionCMS, NotionCMSConfig } from "../src/index";

/**
 * Examples: S3-Compatible Storage Setup
 * 
 * This file demonstrates how to configure NotionCMS with various
 * S3-compatible storage providers for file caching.
 */

// Example 1: AWS S3
console.log("=== Example 1: AWS S3 Configuration ===");

const awsS3Config: NotionCMSConfig = {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://s3.amazonaws.com",
      bucket: "my-notion-files",
      accessKey: process.env.AWS_ACCESS_KEY_ID!,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY!,
      // AWS-specific region (optional, defaults to us-east-1)
      region: "us-west-2",
    },
    cache: {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSize: 1024 * 1024 * 1024, // 1GB (not enforced for S3)
    },
  },
};

const awsCMS = new NotionCMS(process.env.NOTION_TOKEN!, awsS3Config);

async function exampleAWSS3() {
  try {
    // Files will be cached to S3 and return S3 URLs
    const record = await awsCMS.getRecordWithFileProcessing("your-page-id");
    console.log("Files cached to AWS S3:", record);
    
    // Expected file URLs: https://my-notion-files.s3.us-west-2.amazonaws.com/abc123.jpg
  } catch (error) {
    console.error("AWS S3 example error:", error);
  }
}

// Example 2: Vercel Blob Storage
console.log("\n=== Example 2: Vercel Blob Configuration ===");

const vercelBlobConfig: NotionCMSConfig = {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://blob.vercel-storage.com",
      bucket: "notion-files",
      accessKey: process.env.BLOB_READ_WRITE_TOKEN!,
      // Vercel Blob doesn't use secretKey, just the token as accessKey
    },
  },
};

const vercelCMS = new NotionCMS(process.env.NOTION_TOKEN!, vercelBlobConfig);

async function exampleVercelBlob() {
  try {
    const record = await vercelCMS.getRecordWithFileProcessing("your-page-id");
    console.log("Files cached to Vercel Blob:", record);
    
    // Expected file URLs: https://blob.vercel-storage.com/notion-files/abc123.jpg
  } catch (error) {
    console.error("Vercel Blob example error:", error);
  }
}

// Example 3: DigitalOcean Spaces
console.log("\n=== Example 3: DigitalOcean Spaces Configuration ===");

const digitalOceanConfig: NotionCMSConfig = {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://nyc3.digitaloceanspaces.com",
      bucket: "my-space-name",
      accessKey: process.env.DO_SPACES_ACCESS_KEY!,
      secretKey: process.env.DO_SPACES_SECRET_KEY!,
      region: "nyc3",
    },
  },
};

const digitalOceanCMS = new NotionCMS(process.env.NOTION_TOKEN!, digitalOceanConfig);

async function exampleDigitalOceanSpaces() {
  try {
    const record = await digitalOceanCMS.getRecordWithFileProcessing("your-page-id");
    console.log("Files cached to DigitalOcean Spaces:", record);
    
    // Expected file URLs: https://nyc3.digitaloceanspaces.com/my-space-name/abc123.jpg
  } catch (error) {
    console.error("DigitalOcean Spaces example error:", error);
  }
}

// Example 4: MinIO (Self-hosted S3-compatible)
console.log("\n=== Example 4: MinIO Configuration ===");

const minioConfig: NotionCMSConfig = {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://minio.example.com",
      bucket: "notion-cache",
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    },
  },
};

const minioCMS = new NotionCMS(process.env.NOTION_TOKEN!, minioConfig);

async function exampleMinIO() {
  try {
    const record = await minioCMS.getRecordWithFileProcessing("your-page-id");
    console.log("Files cached to MinIO:", record);
    
    // Expected file URLs: https://minio.example.com/notion-cache/abc123.jpg
  } catch (error) {
    console.error("MinIO example error:", error);
  }
}

// Example 5: Cloudflare R2
console.log("\n=== Example 5: Cloudflare R2 Configuration ===");

const r2Config: NotionCMSConfig = {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://your-account-id.r2.cloudflarestorage.com",
      bucket: "notion-files",
      accessKey: process.env.R2_ACCESS_KEY!,
      secretKey: process.env.R2_SECRET_KEY!,
    },
  },
};

const r2CMS = new NotionCMS(process.env.NOTION_TOKEN!, r2Config);

async function exampleCloudflareR2() {
  try {
    const record = await r2CMS.getRecordWithFileProcessing("your-page-id");
    console.log("Files cached to Cloudflare R2:", record);
    
    // Expected file URLs: https://your-account-id.r2.cloudflarestorage.com/notion-files/abc123.jpg
  } catch (error) {
    console.error("Cloudflare R2 example error:", error);
  }
}

// Example 6: Environment-based Configuration
console.log("\n=== Example 6: Environment-based Configuration ===");

function createStorageConfig(): NotionCMSConfig {
  const storageType = process.env.STORAGE_TYPE || "local";
  
  if (storageType === "aws") {
    return {
      files: {
        strategy: "cache",
        storage: {
          type: "s3-compatible",
          endpoint: "https://s3.amazonaws.com",
          bucket: process.env.AWS_BUCKET_NAME!,
          accessKey: process.env.AWS_ACCESS_KEY_ID!,
          secretKey: process.env.AWS_SECRET_ACCESS_KEY!,
          region: process.env.AWS_REGION || "us-east-1",
        },
      },
    };
  } else if (storageType === "vercel") {
    return {
      files: {
        strategy: "cache",
        storage: {
          type: "s3-compatible",
          endpoint: "https://blob.vercel-storage.com",
          bucket: process.env.BLOB_BUCKET_NAME || "notion-files",
          accessKey: process.env.BLOB_READ_WRITE_TOKEN!,
        },
      },
    };
  } else {
    // Default to local storage
    return {
      files: {
        strategy: "cache",
        storage: {
          type: "local",
          path: "./public/assets/notion-files",
        },
      },
    };
  }
}

const envCMS = new NotionCMS(process.env.NOTION_TOKEN!, createStorageConfig());

async function exampleEnvironmentConfig() {
  try {
    const record = await envCMS.getRecordWithFileProcessing("your-page-id");
    console.log("Files cached using environment config:", record);
  } catch (error) {
    console.error("Environment config example error:", error);
  }
}

// Example 7: Error Handling and Fallbacks
console.log("\n=== Example 7: Error Handling and Fallbacks ===");

const fallbackConfig: NotionCMSConfig = {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://invalid-endpoint.example.com",
      bucket: "test-bucket",
      accessKey: "invalid-key",
      secretKey: "invalid-secret",
    },
  },
};

const fallbackCMS = new NotionCMS(process.env.NOTION_TOKEN!, fallbackConfig);

async function exampleErrorHandling() {
  try {
    // This will fail S3 upload but fall back to original Notion URLs
    const record = await fallbackCMS.getRecordWithFileProcessing("your-page-id");
    console.log("Files with fallback URLs:", record);
    
    // Files will have original Notion URLs since S3 upload failed
  } catch (error) {
    console.error("Fallback example error:", error);
  }
}

// Run examples if executed directly
async function runS3Examples() {
  console.log("🚀 S3-Compatible Storage Examples\n");
  
  if (process.env.NOTION_TOKEN) {
    // Only run examples that have the required environment variables
    
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      await exampleAWSS3();
    } else {
      console.log("⚠️  Set AWS credentials to run AWS S3 example");
    }
    
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await exampleVercelBlob();
    } else {
      console.log("⚠️  Set BLOB_READ_WRITE_TOKEN to run Vercel Blob example");
    }
    
    await exampleEnvironmentConfig();
    await exampleErrorHandling();
    
  } else {
    console.log("⚠️  Set NOTION_TOKEN environment variable to run examples");
  }
  
  console.log("\n✅ S3 Examples completed!");
}

// Export for use in other files
export {
  exampleAWSS3,
  exampleVercelBlob,
  exampleDigitalOceanSpaces,
  exampleMinIO,
  exampleCloudflareR2,
  exampleEnvironmentConfig,
  exampleErrorHandling,
};

// Run if this file is executed directly
if (require.main === module) {
  runS3Examples().catch(console.error);
}

/**
 * Installation Requirements:
 * 
 * For S3-compatible storage, install the AWS SDK:
 * ```bash
 * npm install @aws-sdk/client-s3
 * ```
 * 
 * Environment Variables for Examples:
 * 
 * AWS S3:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_BUCKET_NAME
 * - AWS_REGION (optional)
 * 
 * Vercel Blob:
 * - BLOB_READ_WRITE_TOKEN
 * - BLOB_BUCKET_NAME (optional)
 * 
 * DigitalOcean Spaces:
 * - DO_SPACES_ACCESS_KEY
 * - DO_SPACES_SECRET_KEY
 * 
 * MinIO:
 * - MINIO_ACCESS_KEY
 * - MINIO_SECRET_KEY
 * 
 * Cloudflare R2:
 * - R2_ACCESS_KEY
 * - R2_SECRET_KEY
 * 
 * Configuration:
 * - STORAGE_TYPE (aws|vercel|local)
 * - NOTION_TOKEN
 */