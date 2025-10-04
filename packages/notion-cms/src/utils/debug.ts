export interface DebugConfig {
  enabled?: boolean
  level?: "error" | "warn" | "info" | "debug"
}

class DebugLogger {
  private config: DebugConfig = {
    enabled: false,
    level: "info"
  }

  configure(config: DebugConfig) {
    this.config = { ...this.config, ...config }
  }

  private normalizeLevel(level?: string): "error" | "warn" | "info" | "debug" {
    const validLevels = ["error", "warn", "info", "debug"]
    if (level && validLevels.includes(level)) {
      return level as "error" | "warn" | "info" | "debug"
    }
    return "info" // Default fallback for invalid levels
  }

  private shouldLog(level: string): boolean {
    if (!this.config.enabled) return false

    const levels = ["error", "warn", "info", "debug"]
    const configLevel = levels.indexOf(this.normalizeLevel(this.config.level))
    const messageLevel = levels.indexOf(level)

    return messageLevel <= configLevel
  }

  log(...args: any[]) {
    if (this.shouldLog("info")) {
      console.log("[NotionCMS Debug]:", ...args)
    }
  }

  query(databaseId: string, options: any) {
    if (this.shouldLog("debug")) {
      console.log("\n[NotionCMS Query]:", {
        databaseId,
        dataSourceId: options.data_source_id,
        filter: options.filter,
        sorts: options.sorts,
        pageSize: options.page_size,
        startCursor: options.start_cursor,
        includeArchived: options.include_archived,
        timestamp: new Date().toISOString()
      })
    }
  }

  error(error: any, context?: any) {
    if (this.shouldLog("error")) {
      console.error("[NotionCMS Error]:", {
        message: error.message,
        code: error.code,
        context,
        timestamp: new Date().toISOString()
      })
    }
  }
}

export const debug = new DebugLogger()
