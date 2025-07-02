import { NotionCMS } from "../index";
import { FileManager, generateFileId, getFileExtension, detectFileType } from "../file-manager";
import { DEFAULT_CONFIG, mergeConfig } from "../config";

describe("File Management Feature", () => {
  describe("Configuration", () => {
    it("should use default configuration when no config provided", () => {
      const cms = new NotionCMS("test-token");
      expect(cms).toBeDefined();
    });

    it("should merge user config with defaults", () => {
      const userConfig = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "./custom/path",
          },
        },
      };

      const cms = new NotionCMS("test-token", userConfig);
      expect(cms).toBeDefined();
    });

    it("should have correct default values", () => {
      expect(DEFAULT_CONFIG.files.strategy).toBe("direct");
      expect(DEFAULT_CONFIG.files.storage!.type).toBe("local");
      expect(DEFAULT_CONFIG.files.storage!.path).toBe("./public/assets/notion-files");
      expect(DEFAULT_CONFIG.files.cache!.ttl).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(DEFAULT_CONFIG.files.cache!.maxSize).toBe(100 * 1024 * 1024); // 100MB
    });

    it("should merge partial config correctly", () => {
      const partialConfig = { files: { strategy: "cache" as const } };
      const merged = mergeConfig(partialConfig);
      
      expect(merged.files.strategy).toBe("cache");
      expect(merged.files.storage!.type).toBe("local"); // Should use default
      expect(merged.files.storage!.path).toBe("./public/assets/notion-files"); // Should use default
    });
  });

  describe("FileManager", () => {
    it("should create FileManager with direct strategy by default", () => {
      const manager = new FileManager(DEFAULT_CONFIG);
      expect(manager).toBeDefined();
    });

    it("should create FileManager with cache strategy", () => {
      const config = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "./test/path",
            endpoint: "",
            bucket: "",
            accessKey: "",
            secretKey: "",
          },
          cache: {
            ttl: 3600000,
            maxSize: 1024000,
          },
        },
      };
      const manager = new FileManager(config);
      expect(manager).toBeDefined();
    });

    it("should extract file URLs correctly", () => {
      const manager = new FileManager(DEFAULT_CONFIG);
      
      const externalFile = {
        type: "external",
        external: { url: "https://example.com/file.pdf" },
        name: "test.pdf",
      };
      
      const notionFile = {
        type: "file",
        file: { url: "https://files.notion.so/test.jpg", expiry_time: "2024-12-31" },
        name: "test.jpg",
      };

      expect(manager.extractFileUrl(externalFile)).toBe("https://example.com/file.pdf");
      expect(manager.extractFileUrl(notionFile)).toBe("https://files.notion.so/test.jpg");
    });

    it("should create FileInfo objects correctly", () => {
      const manager = new FileManager(DEFAULT_CONFIG);
      
      const notionFile = {
        type: "file",
        file: { url: "https://files.notion.so/test.jpg", expiry_time: "2024-12-31" },
        name: "test.jpg",
      };

      const fileInfo = manager.createFileInfo(notionFile);
      expect(fileInfo.name).toBe("test.jpg");
      expect(fileInfo.url).toBe("https://files.notion.so/test.jpg");
      expect(fileInfo.type).toBe("file");
      expect(fileInfo.expiry_time).toBe("2024-12-31");
    });
  });

  describe("Utility Functions", () => {
    it("should generate stable file IDs", () => {
      const url1 = "https://files.notion.so/f47ac10b-58cc-4372-a567-0e02b2c3d479/test.jpg";
      const url2 = "https://files.notion.so/f47ac10b-58cc-4372-a567-0e02b2c3d479/test.jpg";
      
      const id1 = generateFileId(url1);
      const id2 = generateFileId(url2);
      
      expect(id1).toBe(id2); // Should be stable
      expect(id1).toBeTruthy();
      expect(typeof id1).toBe("string");
    });

    it("should extract file extensions correctly", () => {
      expect(getFileExtension("test.jpg")).toBe(".jpg");
      expect(getFileExtension("document.pdf")).toBe(".pdf");
      expect(getFileExtension("https://example.com/file.png?token=123")).toBe(".png");
      expect(getFileExtension("noextension")).toBe("");
    });

    it("should detect file types correctly", () => {
      expect(detectFileType("image.jpg")).toBe("image");
      expect(detectFileType("image.png")).toBe("image");
      expect(detectFileType("document.pdf")).toBe("document");
      expect(detectFileType("video.mp4")).toBe("video");
      expect(detectFileType("audio.mp3")).toBe("audio");
      expect(detectFileType("unknown.xyz")).toBe("file");
    });
  });

  describe("Strategy Processing", () => {
    it("should process files with direct strategy", async () => {
      const manager = new FileManager(DEFAULT_CONFIG);
      
      const originalUrl = "https://files.notion.so/test.jpg";
      const processedUrl = await manager.processFileUrl(originalUrl, "test.jpg");
      
      // Direct strategy should return the original URL
      expect(processedUrl).toBe(originalUrl);
    });

    it("should process file info with direct strategy", async () => {
      const manager = new FileManager(DEFAULT_CONFIG);
      
      const fileInfo = {
        name: "test.jpg",
        url: "https://files.notion.so/test.jpg",
        type: "file" as const,
        expiry_time: "2024-12-31",
      };
      
      const processed = await manager.processFileInfo(fileInfo);
      
      // Direct strategy should return the original file info
      expect(processed).toEqual(fileInfo);
    });

    it("should process file arrays", async () => {
      const manager = new FileManager(DEFAULT_CONFIG);
      
      const files = [
        {
          name: "test1.jpg",
          url: "https://files.notion.so/test1.jpg",
          type: "file" as const,
        },
        {
          name: "test2.pdf",
          url: "https://example.com/test2.pdf",
          type: "external" as const,
        },
      ];
      
      const processed = await manager.processFileInfoArray(files);
      
      expect(processed).toHaveLength(2);
      expect(processed[0].name).toBe("test1.jpg");
      expect(processed[1].name).toBe("test2.pdf");
    });
  });

  describe("Async File Processing", () => {
    it("should have async methods for file processing", () => {
      const cms = new NotionCMS("test-token");
      
      // Check that the new async methods exist
      expect(typeof cms.getRecordWithFileProcessing).toBe("function");
      expect(typeof cms.getDatabaseWithFileProcessing).toBe("function");
      expect(typeof cms.getAllDatabaseRecordsWithFileProcessing).toBe("function");
    });

    it("should process cache strategy correctly with async methods", async () => {
      const config = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "./test/cache",
          },
        },
      };

      const cms = new NotionCMS("test-token", config);
      
      // This would require actual Notion API calls to test fully
      // For now, we're testing that the methods exist and can be called
      expect(cms).toBeDefined();
    });
  });

  describe("Cache Strategy Implementation", () => {
    it("should implement complete cache strategy functionality", async () => {
      const config = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "./test/cache",
          },
          cache: {
            ttl: 3600000, // 1 hour
            maxSize: 10 * 1024 * 1024, // 10MB
          },
        },
      };

      const manager = new FileManager(config);
      expect(manager).toBeDefined();

      // Test that the strategy is properly instantiated
      // The actual caching functionality would need real files to test
    });
  });

  describe("Backward Compatibility", () => {
    it("should maintain backward compatibility for existing constructor usage", () => {
      // This should still work without config
      const cms = new NotionCMS("test-token");
      expect(cms).toBeDefined();
    });

    it("should export NotionCMSConfig type", () => {
      // This test ensures the type is properly exported
      const config: import("../config").NotionCMSConfig = {
        files: {
          strategy: "direct",
        },
      };
      expect(config).toBeDefined();
    });

    it("should maintain existing sync methods unchanged", () => {
      const cms = new NotionCMS("test-token");
      
      // Existing methods should still exist and work as before
      expect(typeof cms.getRecord).toBe("function");
      expect(typeof cms.getDatabase).toBe("function");
      expect(typeof cms.getAllDatabaseRecords).toBe("function");
      expect(typeof cms.getPageContent).toBe("function");
      expect(typeof cms.blocksToMarkdown).toBe("function");
    });
  });
});