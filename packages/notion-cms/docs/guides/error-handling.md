# Error Handling

This guide covers best practices for error handling, debugging, and troubleshooting when using Notion CMS. Proper error handling ensures your applications are robust and provide good user experiences.

## Understanding Notion CMS Errors

Notion CMS errors generally fall into several categories:

1. **Network Errors** - Connection issues, timeouts
2. **Authentication Errors** - Invalid API keys, permission issues
3. **Validation Errors** - Invalid database IDs, malformed queries
4. **Rate Limit Errors** - Too many requests
5. **Data Errors** - Missing properties, type mismatches

## Error Types and Handling

### Network Errors

Network errors occur when there are connectivity issues or Notion's API is unavailable.

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!);

async function handleNetworkErrors(databaseId: string) {
  try {
    const { results } = await notionCms.getDatabase(databaseId);
    return results;
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      console.error("Network error: Unable to connect to Notion API");
      throw new Error(
        "Network connection failed. Please check your internet connection."
      );
    }

    if (error.code === "TIMEOUT") {
      console.error("Request timed out");
      throw new Error("Request timed out. Please try again.");
    }

    throw error; // Re-throw other errors
  }
}
```

### Authentication Errors

Authentication errors happen when API keys are invalid or missing permissions.

```typescript
async function handleAuthErrors(databaseId: string) {
  try {
    const { results } = await notionCms.getDatabase(databaseId);
    return results;
  } catch (error) {
    if (error.status === 401) {
      console.error("Authentication failed: Invalid API key");
      throw new Error("Invalid Notion API key. Please check your credentials.");
    }

    if (error.status === 403) {
      console.error("Permission denied: Insufficient access to database");
      throw new Error(
        "Access denied. Please ensure the integration has access to this database."
      );
    }

    throw error;
  }
}
```

### Validation Errors

Validation errors occur when request parameters are invalid.

```typescript
async function handleValidationErrors(databaseId: string) {
  try {
    const { results } = await notionCms.getDatabase(databaseId);
    return results;
  } catch (error) {
    if (error.status === 400) {
      console.error("Validation error:", error.message);

      if (error.message.includes("database_id")) {
        throw new Error(
          "Invalid database ID format. Please check the database ID."
        );
      }

      if (error.message.includes("filter")) {
        throw new Error("Invalid filter parameters. Please check your query.");
      }

      throw new Error(`Invalid request: ${error.message}`);
    }

    if (error.status === 404) {
      console.error("Resource not found");
      throw new Error(
        "Database not found. Please check the database ID and permissions."
      );
    }

    throw error;
  }
}
```

### Rate Limit Errors

Notion enforces rate limits to ensure fair usage across all users.

```typescript
class RateLimitHandler {
  private static retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (error.status === 429) {
          if (attempt < maxRetries) {
            const delay = this.retryDelays[attempt] || 8000;
            console.warn(
              `Rate limited. Retrying in ${delay}ms... (attempt ${attempt + 1})`
            );
            await this.delay(delay);
            continue;
          } else {
            throw new Error("Rate limit exceeded. Please try again later.");
          }
        }

        throw error; // Re-throw non-rate-limit errors immediately
      }
    }

    throw lastError;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Usage
async function safeGetDatabase(databaseId: string) {
  return await RateLimitHandler.withRetry(() =>
    notionCms.getDatabase(databaseId)
  );
}
```

## Robust Error Handling Patterns

### Comprehensive Error Handler

Create a centralized error handler for consistent error management:

```typescript
interface NotionError {
  status?: number;
  code?: string;
  message: string;
  object?: string;
}

interface ErrorHandlerOptions {
  retryAttempts?: number;
  logErrors?: boolean;
  fallbackValue?: any;
  onError?: (error: Error) => void;
}

class NotionErrorHandler {
  static async handle<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T> {
    const {
      retryAttempts = 3,
      logErrors = true,
      fallbackValue,
      onError,
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (logErrors) {
          console.error(
            `Attempt ${attempt + 1} failed:`,
            this.formatError(error)
          );
        }

        // Call custom error handler
        if (onError) {
          onError(error);
        }

        // Determine if we should retry
        if (this.shouldRetry(error) && attempt < retryAttempts) {
          const delay = this.calculateDelay(attempt);
          console.log(`Retrying in ${delay}ms...`);
          await this.delay(delay);
          continue;
        }

        break; // Don't retry for non-retryable errors
      }
    }

    // Return fallback value if provided
    if (fallbackValue !== undefined) {
      console.log("Returning fallback value");
      return fallbackValue;
    }

    throw this.enhanceError(lastError);
  }

  private static shouldRetry(error: any): boolean {
    // Retry on rate limits, network errors, and 5xx server errors
    return (
      error.status === 429 ||
      error.status >= 500 ||
      error.code === "ECONNREFUSED" ||
      error.code === "TIMEOUT" ||
      error.code === "ENOTFOUND"
    );
  }

  private static calculateDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static formatError(error: any): string {
    if (error.status) {
      return `HTTP ${error.status}: ${error.message}`;
    }
    return error.message || "Unknown error";
  }

  private static enhanceError(error: any): Error {
    const enhanced = new Error(this.getUserFriendlyMessage(error));
    enhanced.stack = error.stack;
    return enhanced;
  }

  private static getUserFriendlyMessage(error: any): string {
    if (error.status === 401) {
      return "Authentication failed. Please check your Notion API key.";
    }
    if (error.status === 403) {
      return "Access denied. Please ensure your integration has permission to access this database.";
    }
    if (error.status === 404) {
      return "Database not found. Please check the database ID.";
    }
    if (error.status === 429) {
      return "Too many requests. Please try again later.";
    }
    if (error.status >= 500) {
      return "Notion service is temporarily unavailable. Please try again later.";
    }
    if (error.code === "ECONNREFUSED") {
      return "Unable to connect to Notion. Please check your internet connection.";
    }

    return error.message || "An unexpected error occurred.";
  }
}

// Usage examples
async function safeGetDatabase(databaseId: string) {
  return await NotionErrorHandler.handle(
    () => notionCms.getDatabase(databaseId),
    {
      retryAttempts: 3,
      fallbackValue: { results: [], hasMore: false, nextCursor: null },
      onError: (error) => {
        // Log to monitoring service
        console.error("Database fetch failed:", error);
      },
    }
  );
}
```

### Query-Specific Error Handling

Handle errors specific to query operations:

```typescript
class QueryErrorHandler {
  static async safeQuery<T>(
    queryFn: () => Promise<T>,
    context: string = "query"
  ): Promise<T | null> {
    try {
      return await queryFn();
    } catch (error) {
      console.error(`${context} failed:`, error);

      // Handle specific query errors
      if (error.message?.includes("invalid property")) {
        throw new Error(
          `Invalid property in ${context}. Please check your filter conditions.`
        );
      }

      if (error.message?.includes("invalid operator")) {
        throw new Error(
          `Invalid operator in ${context}. Please check your query syntax.`
        );
      }

      return null;
    }
  }
}

// Usage with Query Builder
async function safeQueryBuilder(databaseId: string) {
  const results = await QueryErrorHandler.safeQuery(
    () =>
      notionCms.query(databaseId).where("Status").equals("Published").execute(),
    "published posts query"
  );

  if (!results) {
    console.warn("Query failed, using empty results");
    return [];
  }

  return results;
}
```

## Debugging Techniques

### Request/Response Logging

Enable detailed logging to troubleshoot issues:

```typescript
class DebugNotionCMS {
  private notionCms: NotionCMS;
  private logRequests: boolean;

  constructor(apiKey: string, logRequests: boolean = false) {
    this.notionCms = new NotionCMS(apiKey);
    this.logRequests = logRequests;
  }

  async getDatabase(databaseId: string, options?: any) {
    if (this.logRequests) {
      console.log("🔍 Request:", {
        method: "getDatabase",
        databaseId: databaseId.substring(0, 8) + "...",
        options,
      });
    }

    const startTime = Date.now();

    try {
      const result = await this.notionCms.getDatabase(databaseId, options);

      if (this.logRequests) {
        console.log("✅ Response:", {
          duration: Date.now() - startTime + "ms",
          resultCount: result.results.length,
          hasMore: result.hasMore,
        });
      }

      return result;
    } catch (error) {
      if (this.logRequests) {
        console.error("❌ Error:", {
          duration: Date.now() - startTime + "ms",
          status: error.status,
          message: error.message,
        });
      }
      throw error;
    }
  }
}

// Usage
const debugCms = new DebugNotionCMS(process.env.NOTION_API_KEY!, true);
```

### Property Validation

Validate properties before using them to prevent runtime errors:

```typescript
class PropertyValidator {
  static validateRecord(record: any, requiredFields: string[]): string[] {
    const errors: string[] = [];

    requiredFields.forEach((field) => {
      if (record[field] === null || record[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    return errors;
  }

  static validateDateProperty(record: any, field: string): boolean {
    const value = record[field];
    return value instanceof Date && !isNaN(value.getTime());
  }

  static validateSelectProperty(
    record: any,
    field: string,
    allowedValues: string[]
  ): boolean {
    const value = record[field];
    return typeof value === "string" && allowedValues.includes(value);
  }

  static validateArrayProperty(record: any, field: string): boolean {
    return Array.isArray(record[field]);
  }
}

// Usage
function processRecord(record: any) {
  const errors = PropertyValidator.validateRecord(record, ["Title", "Status"]);

  if (errors.length > 0) {
    console.warn("Record validation failed:", errors);
    return null;
  }

  if (!PropertyValidator.validateDateProperty(record, "PublishDate")) {
    console.warn("Invalid publish date in record:", record.id);
  }

  return record;
}
```

### Schema Inspection

Inspect database schema to understand structure and debug property issues:

```typescript
class SchemaInspector {
  static async inspectDatabase(databaseId: string) {
    try {
      // Get a sample of records
      const { results } = await notionCms.getDatabase(databaseId, {
        pageSize: 5,
      });

      if (results.length === 0) {
        console.log("Database is empty");
        return;
      }

      const sample = results[0];

      console.log("Database Schema Inspection:");
      console.log("==========================");

      // Inspect simple properties
      console.log("\nSimple Properties:");
      Object.keys(sample).forEach((key) => {
        if (key !== "advanced" && key !== "raw") {
          const value = sample[key];
          const type = Array.isArray(value) ? "array" : typeof value;
          const valuePreview = this.formatValuePreview(value);
          console.log(`  ${key}: ${type} - ${valuePreview}`);
        }
      });

      // Inspect advanced properties if available
      if (sample.advanced) {
        console.log("\nAdvanced Properties:");
        Object.keys(sample.advanced).forEach((key) => {
          const value = sample.advanced[key];
          console.log(
            `  ${key}: ${JSON.stringify(value).substring(0, 100)}...`
          );
        });
      }

      // Type analysis across all records
      console.log("\nType Analysis Across Records:");
      this.analyzeTypes(results);
    } catch (error) {
      console.error("Schema inspection failed:", error.message);
    }
  }

  private static formatValuePreview(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string")
      return `"${value.substring(0, 30)}${value.length > 30 ? "..." : ""}"`;
    return String(value);
  }

  private static analyzeTypes(records: any[]) {
    const typeAnalysis = new Map();

    records.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (key !== "advanced" && key !== "raw") {
          const value = record[key];
          const type = Array.isArray(value) ? "array" : typeof value;

          if (!typeAnalysis.has(key)) {
            typeAnalysis.set(key, new Set());
          }
          typeAnalysis.get(key).add(type);
        }
      });
    });

    typeAnalysis.forEach((types, property) => {
      const typeList = Array.from(types).join(" | ");
      console.log(`  ${property}: ${typeList}`);
    });
  }
}

// Usage
await SchemaInspector.inspectDatabase("your-database-id");
```

## Error Monitoring and Alerting

### Error Tracking

Implement error tracking for production applications:

```typescript
interface ErrorReport {
  timestamp: Date;
  operation: string;
  error: string;
  context: any;
  userId?: string;
}

class ErrorTracker {
  private static errors: ErrorReport[] = [];
  private static maxErrors = 100;

  static track(
    operation: string,
    error: Error,
    context: any = {},
    userId?: string
  ) {
    const report: ErrorReport = {
      timestamp: new Date(),
      operation,
      error: error.message,
      context,
      userId,
    };

    this.errors.push(report);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // In production, send to monitoring service
    this.sendToMonitoring(report);
  }

  static getRecentErrors(minutes: number = 60): ErrorReport[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errors.filter((error) => error.timestamp > cutoff);
  }

  static getErrorStats(): { [operation: string]: number } {
    const stats = {};
    this.errors.forEach((error) => {
      stats[error.operation] = (stats[error.operation] || 0) + 1;
    });
    return stats;
  }

  private static sendToMonitoring(report: ErrorReport) {
    // In production, send to services like Sentry, Datadog, etc.
    console.error("Error tracked:", {
      operation: report.operation,
      error: report.error,
      timestamp: report.timestamp.toISOString(),
    });
  }
}

// Usage with error handler
async function trackedOperation(databaseId: string) {
  try {
    return await notionCms.getDatabase(databaseId);
  } catch (error) {
    ErrorTracker.track("getDatabase", error, { databaseId });
    throw error;
  }
}
```

### Health Checks

Implement health checks to monitor API connectivity:

```typescript
class HealthChecker {
  static async checkNotionConnectivity(): Promise<boolean> {
    try {
      // Use a simple API call to check connectivity
      await notionCms.getDatabase("test-database-id");
      return true;
    } catch (error) {
      console.error("Notion health check failed:", error.message);
      return false;
    }
  }

  static async runDiagnostics() {
    console.log("Running Notion CMS Diagnostics...");
    console.log("================================");

    // Check API key
    const hasApiKey = !!process.env.NOTION_API_KEY;
    console.log(`✅ API Key configured: ${hasApiKey ? "Yes" : "No"}`);

    // Check connectivity
    const isConnected = await this.checkNotionConnectivity();
    console.log(
      `${isConnected ? "✅" : "❌"} Notion API connectivity: ${
        isConnected ? "OK" : "Failed"
      }`
    );

    // Check recent errors
    const recentErrors = ErrorTracker.getRecentErrors(60);
    console.log(
      `${recentErrors.length === 0 ? "✅" : "⚠️"} Recent errors (last hour): ${
        recentErrors.length
      }`
    );

    if (recentErrors.length > 0) {
      console.log("Recent error operations:");
      const stats = ErrorTracker.getErrorStats();
      Object.entries(stats).forEach(([operation, count]) => {
        console.log(`  ${operation}: ${count} errors`);
      });
    }
  }
}

// Usage
await HealthChecker.runDiagnostics();
```

## Recovery Strategies

### Graceful Degradation

Implement fallback mechanisms when primary operations fail:

```typescript
class GracefulService {
  private fallbackData = new Map();

  async getDataWithFallback(databaseId: string, cacheKey: string) {
    try {
      const data = await notionCms.getDatabase(databaseId);

      // Cache successful results
      this.fallbackData.set(cacheKey, {
        data: data.results,
        timestamp: Date.now(),
      });

      return data.results;
    } catch (error) {
      console.warn("Primary data fetch failed, checking fallback...");

      const fallback = this.fallbackData.get(cacheKey);
      if (fallback) {
        const age = Date.now() - fallback.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge) {
          console.log("Using cached fallback data");
          return fallback.data;
        }
      }

      console.error("No valid fallback data available");
      throw error;
    }
  }
}
```

### Circuit Breaker Pattern

Prevent cascading failures by temporarily disabling failing operations:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private failureThreshold = 5,
    private timeoutMs = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Usage
const circuitBreaker = new CircuitBreaker(3, 30000);

async function protectedOperation(databaseId: string) {
  return await circuitBreaker.execute(() => notionCms.getDatabase(databaseId));
}
```

## Best Practices Summary

### 1. Always Handle Errors Gracefully

```typescript
// ❌ Don't ignore errors
const data = await notionCms.getDatabase(databaseId);

// ✅ Handle errors appropriately
try {
  const data = await notionCms.getDatabase(databaseId);
  return data;
} catch (error) {
  console.error("Failed to fetch data:", error.message);
  return { results: [], hasMore: false, nextCursor: null };
}
```

### 2. Use Specific Error Messages

```typescript
// ❌ Generic error handling
catch (error) {
  throw new Error("Something went wrong");
}

// ✅ Specific, actionable error messages
catch (error) {
  if (error.status === 404) {
    throw new Error("Database not found. Please check the database ID and ensure the integration has access.");
  }
  throw error;
}
```

### 3. Implement Proper Retry Logic

```typescript
// ✅ Retry with exponential backoff for appropriate errors
const result = await RateLimitHandler.withRetry(() =>
  notionCms.getDatabase(databaseId)
);
```

### 4. Log Errors for Debugging

```typescript
// ✅ Log errors with context
catch (error) {
  console.error("Database fetch failed:", {
    databaseId,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  throw error;
}
```

### 5. Validate Data Early

```typescript
// ✅ Validate critical data before processing
const errors = PropertyValidator.validateRecord(record, ["Title", "Status"]);
if (errors.length > 0) {
  throw new Error(`Invalid record: ${errors.join(", ")}`);
}
```

## Related Documentation

- **[Database Operations](../api-reference/database-operations.md)** - Core API methods and their error conditions
- **[Query Builder](../api-reference/query-builder.md)** - Query-specific error handling
- **[Pagination](./pagination.md)** - Handling pagination errors and recovery
