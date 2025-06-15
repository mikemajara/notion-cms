const DEBUG_ENV_VAR = "NOTION_CMS_DEBUG";

function isDebugEnabled(): boolean {
  // Check for Next.js public env var
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env[`NEXT_PUBLIC_${DEBUG_ENV_VAR}`]
  ) {
    return process.env[`NEXT_PUBLIC_${DEBUG_ENV_VAR}`] === "true";
  }

  // Check for regular Node.js env var
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env[DEBUG_ENV_VAR]
  ) {
    return process.env[DEBUG_ENV_VAR] === "true";
  }

  return false;
}

export const debug = {
  enabled: isDebugEnabled(),

  log(...args: any[]) {
    if (this.enabled) {
      console.log("[NotionCMS Debug]:", ...args);
    }
  },

  query(databaseId: string, options: any) {
    if (this.enabled) {
      console.log("\n[NotionCMS Query]:", {
        databaseId,
        filter: options.filter,
        sorts: options.sorts,
        pageSize: options.page_size,
        startCursor: options.start_cursor,
        timestamp: new Date().toISOString(),
      });
    }
  },

  error(error: any, context?: any) {
    if (this.enabled) {
      console.error("[NotionCMS Error]:", {
        message: error.message,
        code: error.code,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  },
};

console.log(
  "Debug enabled:",
  process.env.NEXT_PUBLIC_NOTION_CMS_DEBUG || "false"
);
