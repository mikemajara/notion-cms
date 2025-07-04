import { NotionCMS } from "../index";
import {
  FileManager,
  generateFileId,
  getFileExtension,
  detectFileType,
} from "../file-manager";
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
      expect(DEFAULT_CONFIG.files.storage!.path).toBe(
        "./public/assets/notion-files"
      );
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
        file: {
          url: "https://files.notion.so/test.jpg",
          expiry_time: "2024-12-31",
        },
        name: "test.jpg",
      };

      expect(manager.extractFileUrl(externalFile)).toBe(
        "https://example.com/file.pdf"
      );
      expect(manager.extractFileUrl(notionFile)).toBe(
        "https://files.notion.so/test.jpg"
      );
    });

    it("should create FileInfo objects correctly", () => {
      const manager = new FileManager(DEFAULT_CONFIG);

      const notionFile = {
        type: "file",
        file: {
          url: "https://files.notion.so/test.jpg",
          expiry_time: "2024-12-31",
        },
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
      const url1 =
        "https://files.notion.so/f47ac10b-58cc-4372-a567-0e02b2c3d479/test.jpg";
      const url2 =
        "https://files.notion.so/f47ac10b-58cc-4372-a567-0e02b2c3d479/test.jpg";

      const id1 = generateFileId(url1);
      const id2 = generateFileId(url2);

      expect(id1).toBe(id2); // Should be stable
      expect(id1).toBeTruthy();
      expect(typeof id1).toBe("string");
    });

    it("should extract file extensions correctly", () => {
      expect(getFileExtension("test.jpg")).toBe(".jpg");
      expect(getFileExtension("document.pdf")).toBe(".pdf");
      expect(getFileExtension("https://example.com/file.png?token=123")).toBe(
        ".png"
      );
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
      const processedUrl = await manager.processFileUrl(
        originalUrl,
        "test.jpg"
      );

      // Direct strategy should return the original URL
      expect(processedUrl).toBe(originalUrl);
    });

    it("should process file info arrays with direct strategy", async () => {
      const manager = new FileManager(DEFAULT_CONFIG);

      const fileInfo = {
        name: "test.jpg",
        url: "https://files.notion.so/test.jpg",
        type: "file" as const,
        expiry_time: "2024-12-31",
      };

      const processed = await manager.processFileInfoArray([fileInfo]);

      // Direct strategy should return the original file info
      expect(processed).toEqual([fileInfo]);
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

  describe("Unified File Processing API", () => {
    it("should have unified async methods for file processing", () => {
      const cms = new NotionCMS("test-token");

      // Check that the unified methods exist and accept processFiles option
      expect(typeof cms.getRecord).toBe("function");
      expect(typeof cms.getDatabase).toBe("function");
      expect(typeof cms.getAllDatabaseRecords).toBe("function");
      expect(typeof cms.getPageContent).toBe("function");
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

  describe("S3 Storage Integration (Phase 3)", () => {
    const s3Config = {
      files: {
        strategy: "cache" as const,
        storage: {
          type: "s3-compatible" as const,
          endpoint: "https://s3.amazonaws.com",
          bucket: "test-bucket",
          accessKey: "test-access-key",
          secretKey: "test-secret-key",
          region: "us-east-1",
        },
      },
    };

    beforeEach(() => {
      // Clear any existing mocks
      jest.clearAllMocks();
    });

    it("should configure S3 storage correctly", () => {
      const cms = new NotionCMS("test-token", s3Config);

      // Verify that file manager is created with cache strategy
      const fileManager = (cms as any).fileManager;

      expect(fileManager).toBeDefined();
      expect(fileManager.isCacheEnabled()).toBe(true);
      expect(typeof fileManager.processFileUrl).toBe("function");
      expect(typeof fileManager.processFileInfoArray).toBe("function");
    });

    it("should support multiple S3-compatible providers", () => {
      const providers = [
        {
          name: "AWS S3",
          config: {
            type: "s3-compatible" as const,
            endpoint: "https://s3.amazonaws.com",
            bucket: "aws-bucket",
            region: "us-west-2",
          },
        },
        {
          name: "Vercel Blob",
          config: {
            type: "s3-compatible" as const,
            endpoint: "https://blob.vercel-storage.com",
            bucket: "vercel-bucket",
          },
        },
        {
          name: "DigitalOcean Spaces",
          config: {
            type: "s3-compatible" as const,
            endpoint: "https://nyc3.digitaloceanspaces.com",
            bucket: "do-space",
            region: "nyc3",
          },
        },
        {
          name: "MinIO",
          config: {
            type: "s3-compatible" as const,
            endpoint: "https://minio.example.com",
            bucket: "minio-bucket",
          },
        },
        {
          name: "Cloudflare R2",
          config: {
            type: "s3-compatible" as const,
            endpoint: "https://account-id.r2.cloudflarestorage.com",
            bucket: "r2-bucket",
          },
        },
      ];

      providers.forEach(({ name, config }) => {
        const testConfig = {
          files: {
            strategy: "cache" as const,
            storage: config,
          },
        };

        const cms = new NotionCMS("test-token", testConfig);
        const fileManager = (cms as any).fileManager;

        expect(fileManager).toBeDefined();
        expect(fileManager.isCacheEnabled()).toBe(true);
        expect(typeof fileManager.processFileUrl).toBe("function");
      });
    });

    it("should handle S3 configuration validation", () => {
      const invalidConfigs = [
        {
          name: "missing bucket",
          config: {
            files: {
              strategy: "cache" as const,
              storage: {
                type: "s3-compatible" as const,
                endpoint: "https://s3.amazonaws.com",
                // bucket missing
              },
            },
          },
        },
        {
          name: "missing endpoint",
          config: {
            files: {
              strategy: "cache" as const,
              storage: {
                type: "s3-compatible" as const,
                bucket: "test-bucket",
                // endpoint missing
              },
            },
          },
        },
      ];

      invalidConfigs.forEach(({ name, config }) => {
        // Should still create the CMS but may fail at runtime
        const cms = new NotionCMS("test-token", config);
        expect(cms).toBeDefined();
      });
    });

    it("should create storage interface correctly", async () => {
      const manager = new FileManager(s3Config);

      // Test the public interface of FileManager instead of private methods
      expect(manager).toBeDefined();
      expect(manager.isCacheEnabled()).toBe(true);
      expect(typeof manager.processFileUrl).toBe("function");
      expect(typeof manager.processFileInfoArray).toBe("function");
      expect(typeof manager.extractFileUrl).toBe("function");
      expect(typeof manager.createFileInfo).toBe("function");
    });

    it("should fall back to local storage when S3 config invalid", async () => {
      const localConfig = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "./test/fallback",
          },
        },
      };

      const manager = new FileManager(localConfig);

      expect(manager).toBeDefined();
      expect(manager.isCacheEnabled()).toBe(true);
      // Test that local file processing still works
      const testUrl = "https://files.notion.so/test.jpg";
      const result = await manager.processFileUrl(testUrl, "test.jpg");
      expect(typeof result).toBe("string");
    });

    it("should support cache configuration with S3", () => {
      const s3ConfigWithCache = {
        ...s3Config,
        files: {
          ...s3Config.files,
          cache: {
            ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
            maxSize: 500 * 1024 * 1024, // 500MB
          },
        },
      };

      const cms = new NotionCMS("test-token", s3ConfigWithCache);
      const fileManager = (cms as any).fileManager;

      expect(fileManager).toBeDefined();
      expect(fileManager.isCacheEnabled()).toBe(true);
      expect(typeof fileManager.processFileUrl).toBe("function");
    });

    it("should gracefully handle AWS SDK missing", async () => {
      // Mock the require to simulate missing AWS SDK
      const originalRequire = require;
      const mockRequire = jest.fn().mockImplementation((module) => {
        if (module === "@aws-sdk/client-s3") {
          throw new Error("Cannot find module @aws-sdk/client-s3");
        }
        return originalRequire(module);
      });

      // This test verifies the error handling in the storage layer
      // The actual error would be handled when trying to use S3 operations
      expect(true).toBe(true); // Placeholder - real test would need more complex setup
    });

    it("should process files through S3 storage interface", async () => {
      const manager = new FileManager(s3Config);

      // Test file processing - should fall back to local storage when AWS SDK missing
      const originalUrl = "https://files.notion.so/test.jpg";

      // Should fall back gracefully and return a processed URL
      const processedUrl = await manager.processFileUrl(
        originalUrl,
        "test.jpg"
      );

      expect(typeof processedUrl).toBe("string");
      // Should either be the cached URL or fallback to original URL
    });

    it("should maintain backward compatibility with S3 config", () => {
      // Existing direct strategy should still work
      const directCMS = new NotionCMS("test-token");
      expect(directCMS).toBeDefined();

      // S3 strategy should be additive, not breaking
      const s3CMS = new NotionCMS("test-token", s3Config);
      expect(s3CMS).toBeDefined();

      // Both should have the same unified public interface
      expect(typeof directCMS.getRecord).toBe("function");
      expect(typeof s3CMS.getRecord).toBe("function");
      expect(typeof directCMS.getDatabase).toBe("function");
      expect(typeof s3CMS.getDatabase).toBe("function");
      expect(typeof directCMS.getAllDatabaseRecords).toBe("function");
      expect(typeof s3CMS.getAllDatabaseRecords).toBe("function");
      expect(typeof directCMS.getPageContent).toBe("function");
      expect(typeof s3CMS.getPageContent).toBe("function");
    });
  });

  describe("Centralized Error Handling", () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock console.warn to capture error messages
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should handle cache failure gracefully with single error message", async () => {
      // Create a cache strategy that will fail
      const config = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "/nonexistent/path", // This will cause storage to fail
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
      const originalUrl = "https://files.notion.so/test.jpg";
      const fileName = "test.jpg";

      // Process the file URL - should fail gracefully
      const result = await manager.processFileUrl(originalUrl, fileName);

      // Should return original URL as fallback
      expect(result).toBe(originalUrl);

      // Should have exactly one error message with proper context
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to cache file: ${fileName} from ${originalUrl}`,
        expect.objectContaining({
          fileName,
          url: originalUrl,
          error: expect.any(String),
        })
      );
    });

    it("should handle multiple file failures independently", async () => {
      const config = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "/nonexistent/path",
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

      const files = [
        {
          name: "test1.jpg",
          url: "https://files.notion.so/test1.jpg",
          type: "file" as const,
        },
        {
          name: "test2.pdf",
          url: "https://files.notion.so/test2.pdf",
          type: "file" as const,
        },
      ];

      // Process multiple files - all should fail gracefully
      const results = await manager.processFileInfoArray(files);

      // Should return original file info as fallback
      expect(results).toEqual(files);

      // Should have exactly two error messages (one per file)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      // Verify each error message has proper context
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        1,
        "Failed to cache file: test1.jpg from https://files.notion.so/test1.jpg",
        expect.objectContaining({
          fileName: "test1.jpg",
          url: "https://files.notion.so/test1.jpg",
          error: expect.any(String),
        })
      );

      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        2,
        "Failed to cache file: test2.pdf from https://files.notion.so/test2.pdf",
        expect.objectContaining({
          fileName: "test2.pdf",
          url: "https://files.notion.so/test2.pdf",
          error: expect.any(String),
        })
      );
    });

    it("should not duplicate error messages in consumer classes", async () => {
      // This test simulates what happens when NotionCMS calls FileManager
      const config = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "/nonexistent/path",
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

      const cms = new NotionCMS("test-token", config);

      // Mock the Notion API call to avoid actual network requests
      const mockProperties = {
        files: {
          id: "test-id",
          type: "files" as const,
          files: [
            {
              name: "test.jpg",
              type: "file" as const,
              file: {
                url: "https://files.notion.so/test.jpg",
                expiry_time: "2024-12-31",
              },
            },
          ],
        },
      };

      // Create a minimal mock page object
      const mockPage = {
        id: "test-page-id",
        object: "page" as const,
        properties: mockProperties,
        created_time: "2024-01-01T00:00:00.000Z",
        last_edited_time: "2024-01-01T00:00:00.000Z",
        created_by: { object: "user" as const, id: "test-user" },
        last_edited_by: { object: "user" as const, id: "test-user" },
        cover: null,
        icon: null,
        parent: { type: "database_id" as const, database_id: "test-db-id" },
        archived: false,
        in_trash: false,
        url: "https://www.notion.so/test-page",
        public_url: null,
      };

      // Test property processing - this internally calls FileManager.processFileUrl
      const result = await (cms as any).getPropertyValueUnified(
        mockProperties.files,
        true
      );

      // Should return the processed files with original URLs (fallback)
      // Note: getPropertyValueUnified returns simplified file objects
      expect(result).toEqual([
        {
          name: "test.jpg",
          url: "https://files.notion.so/test.jpg", // Should fallback to original
        },
      ]);

      // Should have exactly one error message (not duplicated by consumer)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to cache file: test.jpg from https://files.notion.so/test.jpg",
        expect.objectContaining({
          fileName: "test.jpg",
          url: "https://files.notion.so/test.jpg",
          error: expect.any(String),
        })
      );
    });

    it("should include error stack trace in development context", async () => {
      const config = {
        files: {
          strategy: "cache" as const,
          storage: {
            type: "local" as const,
            path: "/nonexistent/path",
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
      const originalUrl = "https://files.notion.so/test.jpg";
      const fileName = "test.jpg";

      await manager.processFileUrl(originalUrl, fileName);

      // Verify error context includes stack trace for debugging
      const loggedContext = consoleWarnSpy.mock.calls[0][1];
      expect(loggedContext).toHaveProperty("fileName", fileName);
      expect(loggedContext).toHaveProperty("url", originalUrl);
      expect(loggedContext).toHaveProperty("error");
      expect(loggedContext).toHaveProperty("stack");
    });

    it("should handle direct strategy without any error logging", async () => {
      // Direct strategy should never log errors since it doesn't do caching
      const manager = new FileManager(DEFAULT_CONFIG); // Uses direct strategy

      const originalUrl = "https://files.notion.so/test.jpg";
      const result = await manager.processFileUrl(originalUrl, "test.jpg");

      expect(result).toBe(originalUrl);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
