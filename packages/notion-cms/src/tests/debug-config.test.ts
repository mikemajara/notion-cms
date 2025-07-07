import { NotionCMS } from "../index";
import { debug } from "../utils/debug";
import { DebugConfig } from "../config";

// Mock console methods to capture output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let logCalls: any[][] = [];
let errorCalls: any[][] = [];

beforeEach(() => {
  logCalls = [];
  errorCalls = [];

  console.log = jest.fn((...args) => {
    logCalls.push(args);
  });

  console.error = jest.fn((...args) => {
    errorCalls.push(args);
  });

  // Clear environment variables
  delete process.env.NOTION_CMS_DEBUG;
  delete process.env.NEXT_PUBLIC_NOTION_CMS_DEBUG;
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe("Debug Configuration System", () => {
  const mockToken = "test-token";

  describe("Default Behavior", () => {
    test("debug should be disabled by default", () => {
      const cms = new NotionCMS(mockToken);

      debug.log("test message");
      debug.error({ message: "test error", code: "TEST" });
      debug.query("db123", { filter: {}, sorts: [] });

      expect(logCalls).toHaveLength(0);
      expect(errorCalls).toHaveLength(0);
    });

    test("debug should be disabled when config is empty", () => {
      const cms = new NotionCMS(mockToken, {});

      debug.log("test message");
      debug.error({ message: "test error", code: "TEST" });

      expect(logCalls).toHaveLength(0);
      expect(errorCalls).toHaveLength(0);
    });
  });

  describe("Config-based Debug Control", () => {
    test("debug can be enabled via config", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: true },
      });

      debug.log("test message");

      expect(logCalls).toHaveLength(1);
      expect(logCalls[0][0]).toBe("[NotionCMS Debug]:");
      expect(logCalls[0][1]).toBe("test message");
    });

    test("debug can be explicitly disabled via config", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: false },
      });

      debug.log("test message");
      debug.error({ message: "test error", code: "TEST" });

      expect(logCalls).toHaveLength(0);
      expect(errorCalls).toHaveLength(0);
    });
  });

  describe("Log Level Filtering", () => {
    test("error level should only show errors", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: true, level: "error" },
      });

      debug.log("info message");
      debug.error({ message: "error message", code: "ERR" });
      debug.query("db123", { filter: {} });

      expect(logCalls).toHaveLength(0); // log() and query() should be filtered out
      expect(errorCalls).toHaveLength(1);
      expect(errorCalls[0][0]).toBe("[NotionCMS Error]:");
    });

    test("info level should show errors and info messages", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: true, level: "info" },
      });

      debug.log("info message");
      debug.error({ message: "error message", code: "ERR" });
      debug.query("db123", { filter: {} }); // query is debug level

      expect(logCalls).toHaveLength(1); // Only log() should appear
      expect(errorCalls).toHaveLength(1); // Error should appear
      expect(logCalls[0][1]).toBe("info message");
    });

    test("debug level should show all messages", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: true, level: "debug" },
      });

      debug.log("info message");
      debug.error({ message: "error message", code: "ERR" });
      debug.query("db123", { filter: {}, sorts: [] });

      expect(logCalls).toHaveLength(2); // log() and query()
      expect(errorCalls).toHaveLength(1); // error()
    });

    test("default log level should be info when not specified", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: true }, // level not specified
      });

      debug.log("info message");
      debug.query("db123", { filter: {} }); // should be filtered out at info level

      expect(logCalls).toHaveLength(1); // Only log() should appear
      expect(logCalls[0][1]).toBe("info message");
    });
  });

  describe("Environment Variable Backward Compatibility", () => {
    test("NOTION_CMS_DEBUG env var should enable debug", () => {
      process.env.NOTION_CMS_DEBUG = "true";

      const cms = new NotionCMS(mockToken); // No config provided

      debug.log("test message");

      expect(logCalls).toHaveLength(1);
      expect(logCalls[0][1]).toBe("test message");
    });

    test("NEXT_PUBLIC_NOTION_CMS_DEBUG env var should enable debug", () => {
      process.env.NEXT_PUBLIC_NOTION_CMS_DEBUG = "true";

      const cms = new NotionCMS(mockToken); // No config provided

      debug.log("test message");

      expect(logCalls).toHaveLength(1);
      expect(logCalls[0][1]).toBe("test message");
    });

    test("config should override environment variables", () => {
      process.env.NOTION_CMS_DEBUG = "true";

      const cms = new NotionCMS(mockToken, {
        debug: { enabled: false }, // Explicitly disabled
      });

      debug.log("test message");

      expect(logCalls).toHaveLength(0); // Config should override env var
    });

    test("env var false value should be respected", () => {
      process.env.NOTION_CMS_DEBUG = "false";

      const cms = new NotionCMS(mockToken);

      debug.log("test message");

      expect(logCalls).toHaveLength(0);
    });
  });

  describe("Debug Method Functionality", () => {
    beforeEach(() => {
      // Enable debug for these tests
      new NotionCMS(mockToken, {
        debug: { enabled: true, level: "debug" },
      });
    });

    test("debug.log should format messages correctly", () => {
      debug.log("simple message");
      debug.log("message with", "multiple", "args");

      expect(logCalls).toHaveLength(2);
      expect(logCalls[0]).toEqual(["[NotionCMS Debug]:", "simple message"]);
      expect(logCalls[1]).toEqual([
        "[NotionCMS Debug]:",
        "message with",
        "multiple",
        "args",
      ]);
    });

    test("debug.query should format query details correctly", () => {
      const mockOptions = {
        filter: { property: "Status", select: { equals: "Done" } },
        sorts: [{ property: "Created", direction: "descending" }],
        page_size: 50,
        start_cursor: "abc123",
      };

      debug.query("database123", mockOptions);

      expect(logCalls).toHaveLength(1);
      expect(logCalls[0][0]).toBe("\n[NotionCMS Query]:");

      const queryDetails = logCalls[0][1];
      expect(queryDetails.databaseId).toBe("database123");
      expect(queryDetails.filter).toEqual(mockOptions.filter);
      expect(queryDetails.sorts).toEqual(mockOptions.sorts);
      expect(queryDetails.pageSize).toBe(50);
      expect(queryDetails.startCursor).toBe("abc123");
      expect(queryDetails.timestamp).toBeDefined();
    });

    test("debug.error should format error details correctly", () => {
      const mockError = {
        message: "API request failed",
        code: "API_ERROR",
      };
      const mockContext = { databaseId: "db123", operation: "query" };

      debug.error(mockError, mockContext);

      expect(errorCalls).toHaveLength(1);
      expect(errorCalls[0][0]).toBe("[NotionCMS Error]:");

      const errorDetails = errorCalls[0][1];
      expect(errorDetails.message).toBe("API request failed");
      expect(errorDetails.code).toBe("API_ERROR");
      expect(errorDetails.context).toEqual(mockContext);
      expect(errorDetails.timestamp).toBeDefined();
    });

    test("debug.error should work without context", () => {
      const mockError = {
        message: "Simple error",
        code: "SIMPLE",
      };

      debug.error(mockError);

      expect(errorCalls).toHaveLength(1);
      const errorDetails = errorCalls[0][1];
      expect(errorDetails.message).toBe("Simple error");
      expect(errorDetails.context).toBeUndefined();
    });
  });

  describe("Configuration Validation", () => {
    test("invalid log level should default to info", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: true, level: "invalid" as any },
      });

      debug.log("info message");
      debug.query("db123", { filter: {} }); // debug level, should be filtered

      expect(logCalls).toHaveLength(1); // Should behave like info level
    });

    test("partial debug config should use defaults", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: true }, // level not specified
      });

      debug.log("info message");

      expect(logCalls).toHaveLength(1); // Should default to info level
    });
  });

  describe("Integration with Existing Debug Calls", () => {
    test("all existing debug methods should respect central configuration", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: true, level: "debug" },
      });

      // Simulate calls that would come from database-service.ts and query-builder.ts
      debug.query("db123", { filter: {}, sorts: [], page_size: 10 });
      debug.log("Database query completed");
      debug.error(
        { message: "Query failed", code: "QUERY_ERROR" },
        { databaseId: "db123" }
      );

      expect(logCalls).toHaveLength(2); // query() and log()
      expect(errorCalls).toHaveLength(1); // error()
    });

    test("disabled debug should silence all existing calls", () => {
      const cms = new NotionCMS(mockToken, {
        debug: { enabled: false },
      });

      // Simulate all types of existing debug calls
      debug.query("db123", { filter: {}, sorts: [] });
      debug.log("Operation completed");
      debug.error({ message: "Error occurred", code: "ERROR" });

      expect(logCalls).toHaveLength(0);
      expect(errorCalls).toHaveLength(0);
    });
  });
});

describe("DebugConfig Type Safety", () => {
  test("DebugConfig interface should allow valid configurations", () => {
    const validConfigs: DebugConfig[] = [
      { enabled: true },
      { enabled: false },
      { enabled: true, level: "error" },
      { enabled: true, level: "warn" },
      { enabled: true, level: "info" },
      { enabled: true, level: "debug" },
      { level: "info" }, // enabled can be undefined
      {}, // both can be undefined
    ];

    // This test mainly validates TypeScript compilation
    expect(validConfigs).toBeDefined();
  });
});
