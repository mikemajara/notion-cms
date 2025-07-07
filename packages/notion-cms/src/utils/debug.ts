export interface DebugConfig {
  enabled?: boolean;
  level?: "error" | "warn" | "info" | "debug";
}

class DebugLogger {
  private config: DebugConfig = {
    enabled: false,
    level: "info",
  };

  constructor() {
    // Initialize with environment variable fallback
    this.config.enabled = this.isDebugEnabledFromEnv();
  }

  configure(config: DebugConfig) {
    this.config = { ...this.config, ...config };
  }

  private isDebugEnabledFromEnv(): boolean {
    // Check for Next.js public env var
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env[`NEXT_PUBLIC_NOTION_CMS_DEBUG`]
    ) {
      return process.env[`NEXT_PUBLIC_NOTION_CMS_DEBUG`] === "true";
    }

    // Check for regular Node.js env var
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env["NOTION_CMS_DEBUG"]
    ) {
      return process.env["NOTION_CMS_DEBUG"] === "true";
    }

    return false;
  }

  private normalizeLevel(level?: string): "error" | "warn" | "info" | "debug" {
    const validLevels = ["error", "warn", "info", "debug"];
    if (level && validLevels.includes(level)) {
      return level as "error" | "warn" | "info" | "debug";
    }
    return "info"; // Default fallback for invalid levels
  }

  private shouldLog(level: string): boolean {
    if (!this.config.enabled) return false;

    const levels = ["error", "warn", "info", "debug"];
    const configLevel = levels.indexOf(this.normalizeLevel(this.config.level));
    const messageLevel = levels.indexOf(level);

    return messageLevel <= configLevel;
  }

  log(...args: any[]) {
    if (this.shouldLog("info")) {
      console.log("[NotionCMS Debug]:", ...args);
    }
  }

  query(databaseId: string, options: any) {
    if (this.shouldLog("debug")) {
      console.log("\n[NotionCMS Query]:", {
        databaseId,
        filter: options.filter,
        sorts: options.sorts,
        pageSize: options.page_size,
        startCursor: options.start_cursor,
        timestamp: new Date().toISOString(),
      });
    }
  }

  error(error: any, context?: any) {
    if (this.shouldLog("error")) {
      console.error("[NotionCMS Error]:", {
        message: error.message,
        code: error.code,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const debug = new DebugLogger();
