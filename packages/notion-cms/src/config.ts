/**
 * Configuration options for NotionCMS file management
 */

const DEFAULT_LOCAL_PATH = "./public/assets/notion-files";

/**
 * File management strategies
 */
export type FileStrategy = "direct" | "local" | "remote";

/**
 * Configuration options for debug logging
 */
export interface DebugConfig {
  /**
   * Enable/disable all logging
   * @default false
   */
  enabled?: boolean;

  /**
   * Log level - controls what gets logged
   * @default "info"
   */
  level?: "error" | "warn" | "info" | "debug";
}

/**
 * Unified storage configuration
 */
export interface StorageConfig {
  /**
   * Storage path - used for:
   * - Local strategy: Local directory path (e.g., "./public/notion-files")
   * - Remote strategy: S3 key prefix (e.g., "uploads/notion/")
   */
  path?: string;
  /**
   * S3-compatible endpoint (required for remote strategy)
   */
  endpoint: string;
  /**
   * S3 bucket name (required for remote strategy)
   */
  bucket?: string;
  /**
   * S3 access key (required for remote strategy)
   */
  accessKey: string;
  /**
   * S3 secret key (required for remote strategy)
   */
  secretKey: string;
  /**
   * S3 region (optional)
   */
  region?: string;
}

export interface NotionCMSConfig {
  /**
   * File handling configuration
   */
  files?: {
    /**
     * File handling strategy
     * - "direct": Link directly to Notion files (default)
     * - "local": Download and cache files locally
     * - "remote": Store files in S3-compatible storage
     */
    strategy?: FileStrategy;
    /**
     * Storage configuration (used for local and remote strategies)
     */
    storage?: StorageConfig;
  };
  debug?: DebugConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  files: {
    strategy: "direct" as FileStrategy,
    storage: {
      path: DEFAULT_LOCAL_PATH,
      endpoint: "",
      bucket: "",
      accessKey: "",
      secretKey: "",
      region: "",
    },
  },
  debug: {
    enabled: false,
    level: "info" as const,
  },
} as const;

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig?: NotionCMSConfig) {
  if (!userConfig) return DEFAULT_CONFIG;

  return {
    files: {
      strategy: userConfig.files?.strategy ?? DEFAULT_CONFIG.files.strategy,
      storage: {
        path: userConfig.files?.storage?.path ?? DEFAULT_CONFIG.files.storage.path,
        endpoint: userConfig.files?.storage?.endpoint ?? DEFAULT_CONFIG.files.storage.endpoint,
        bucket: userConfig.files?.storage?.bucket ?? DEFAULT_CONFIG.files.storage.bucket,
        accessKey: userConfig.files?.storage?.accessKey ?? DEFAULT_CONFIG.files.storage.accessKey,
        secretKey: userConfig.files?.storage?.secretKey ?? DEFAULT_CONFIG.files.storage.secretKey,
        region: userConfig.files?.storage?.region ?? DEFAULT_CONFIG.files.storage.region,
      },
    },
    debug: {
      enabled: userConfig.debug?.enabled ?? DEFAULT_CONFIG.debug.enabled,
      level: userConfig.debug?.level ?? DEFAULT_CONFIG.debug.level,
    },
  };
}
