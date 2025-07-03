import { NotionCMS, NotionCMSConfig } from "../src/index";

/**
 * Example: File Management with Different Strategies
 * 
 * This example demonstrates how to use the new file management feature
 * introduced in the File Management PRD implementation.
 */

// Example 1: Zero-Config (Default behavior - Direct strategy)
console.log("=== Example 1: Zero-Config (Direct Strategy) ===");

const defaultCMS = new NotionCMS(process.env.NOTION_TOKEN!);

async function exampleDirectStrategy() {
  try {
    // Get a record with file properties
    const record = await defaultCMS.getRecord("your-page-id");
    
    // Simple API - files are returned with original Notion URLs
    console.log("Simple API - File URLs:");
    const recordAny = record as any; // Type assertion for example code
    if (recordAny.Files) {
      recordAny.Files.forEach((file: any, index: number) => {
        console.log(`  File ${index + 1}: ${file.name} -> ${file.url}`);
      });
    }
    
    // Advanced API - includes complete file metadata
    console.log("Advanced API - Detailed file info:");
    if (recordAny.advanced?.Files) {
      recordAny.advanced.Files.forEach((file: any, index: number) => {
        console.log(`  File ${index + 1}:`, {
          name: file.name,
          type: file.type,
          url: file.type === "external" ? file.external?.url : file.file?.url,
          expiry: file.file?.expiry_time || "N/A",
        });
      });
    }
    
    // Raw API - original Notion response
    console.log("Raw API available at: record.raw.properties.Files");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example 2: Local Cache Strategy
console.log("\n=== Example 2: Local Cache Strategy ===");

const localCacheConfig: NotionCMSConfig = {
  files: {
    strategy: "cache",
    storage: {
      type: "local",
      path: "./public/assets/notion-files",
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100 * 1024 * 1024, // 100MB
    },
  },
};

const localCacheCMS = new NotionCMS(process.env.NOTION_TOKEN!, localCacheConfig);

async function exampleLocalCacheStrategy() {
  try {
    const record = await localCacheCMS.getRecord("your-page-id");
    
    console.log("With cache strategy (once implemented in Phase 2):");
    console.log("- Files will be downloaded and stored locally");
    console.log("- URLs will point to cached versions");
    console.log("- Example: /assets/notion-files/abc123.jpg");
    
    // For now, it still returns original URLs but the infrastructure is ready
    const recordAny = record as any; // Type assertion for example code
    if (recordAny.Files) {
      recordAny.Files.forEach((file: any, index: number) => {
        console.log(`  File ${index + 1}: ${file.name} -> ${file.url}`);
      });
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example 3: S3-Compatible Storage (Future - Phase 3)
console.log("\n=== Example 3: S3-Compatible Storage (Phase 3) ===");

const s3Config: NotionCMSConfig = {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://s3.amazonaws.com",
      bucket: "my-notion-files",
      accessKey: process.env.AWS_ACCESS_KEY!,
      secretKey: process.env.AWS_SECRET_KEY!,
    },
  },
};

const s3CMS = new NotionCMS(process.env.NOTION_TOKEN!, s3Config);

console.log("S3-compatible storage configuration created.");
console.log("Implementation will be added in Phase 3.");

// Example 4: Working with Page Content Blocks
console.log("\n=== Example 4: Page Content with Files ===");

async function examplePageContentFiles() {
  try {
    const blocks = await defaultCMS.getPageContent("your-page-id");
    
    console.log("File blocks in page content:");
    blocks.forEach((block: any, index: number) => {
      if (["image", "file", "pdf", "video", "audio"].includes(block.type)) {
        console.log(`  Block ${index + 1} (${block.type}):`, {
          url: block.content.url,
          caption: block.content.caption || "No caption",
        });
      }
    });
    
    // Convert to markdown with file URLs
    const markdown = defaultCMS.blocksToMarkdown(blocks);
    
    console.log("Markdown with file URLs:");
    console.log(markdown.substring(0, 200) + "...");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example 5: Utility Functions
console.log("\n=== Example 5: Utility Functions ===");

import { generateFileId, getFileExtension, detectFileType } from "../src/file-manager";

function exampleUtilities() {
  const notionUrl = "https://files.notion.so/f47ac10b-58cc-4372-a567-0e02b2c3d479/image.jpg?token=abc123";
  
  console.log("Utility functions:");
  console.log(`  File ID: ${generateFileId(notionUrl)}`);
  console.log(`  Extension: ${getFileExtension("document.pdf")}`);
  console.log(`  File type: ${detectFileType("image.jpg")}`);
}

// Run examples
async function runExamples() {
  console.log("🚀 File Management Feature Examples\n");
  
  exampleUtilities();
  
  if (process.env.NOTION_TOKEN) {
    await exampleDirectStrategy();
    await exampleLocalCacheStrategy();
    await examplePageContentFiles();
  } else {
    console.log("\n⚠️  Set NOTION_TOKEN environment variable to run database examples");
  }
  
  console.log("\n✅ Examples completed!");
}

// Export for use in other files
export {
  exampleDirectStrategy,
  exampleLocalCacheStrategy,
  examplePageContentFiles,
  exampleUtilities,
};

// Run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

/**
 * Key Benefits Implemented:
 * 
 * 1. ✅ Zero Breaking Changes: Existing code continues to work unchanged
 * 2. ✅ Bug Fix: File properties now return URLs for both external AND Notion-hosted files
 * 3. ✅ Configuration System: Optional file management strategies
 * 4. ✅ Layered API: Simple, Advanced, and Raw access levels maintained
 * 5. ✅ Strategy Pattern: Ready for cache implementation in Phase 2
 * 6. ✅ Type Safety: Full TypeScript support with proper exports
 * 7. ✅ Framework Agnostic: Works with any JavaScript framework
 * 8. ✅ Utility Functions: File processing helpers available
 * 
 * Next Steps (Future Phases):
 * - Phase 2: Implement local storage caching
 * - Phase 3: Add S3-compatible storage support
 * - Phase 4: Documentation and advanced examples
 */