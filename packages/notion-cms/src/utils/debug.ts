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

  query(
    context:
      | { dataSourceId?: string; databaseId?: string; label?: string }
      | string,
    options: any = {}
  ) {
    if (!this.shouldLog("debug")) {
      return
    }

    const normalized =
      typeof context === "string"
        ? { dataSourceId: context, databaseId: context, label: context }
        : {
            dataSourceId: context.dataSourceId ?? context.databaseId,
            databaseId: context.databaseId ?? context.dataSourceId,
            label: context.label
          }

    const queryDetails = {
      label: normalized.label,
      dataSourceId: normalized.dataSourceId,
      databaseId: normalized.databaseId,
      filter: options.filter,
      sorts: options.sorts,
      pageSize: options.page_size ?? options.pageSize,
      startCursor: options.start_cursor ?? options.startCursor,
      includeArchived: options.include_archived ?? options.includeArchived,
      timestamp: new Date().toISOString()
    }

    console.log("\n[NotionCMS Query]:", queryDetails)
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
