/**
 * Configuration options for NotionCMS file management
 */
export interface NotionCMSConfig {
  files?: {
    strategy: "direct" | "cache";
    storage?: {
      type: "local" | "s3-compatible";
      // For local storage
      path?: string; // default: "./public/assets/notion-files"
      // For S3-compatible storage
      endpoint?: string;
      bucket?: string;
      accessKey?: string;
      secretKey?: string;
      region?: string; // AWS region or equivalent for other providers
    };
    cache?: {
      ttl: number; // default 24 hours
      maxSize: number; // default 100MB
    };
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<NotionCMSConfig> = {
  files: {
    strategy: "direct",
    storage: {
      type: "local",
      path: "./public/assets/notion-files",
      endpoint: "",
      bucket: "",
      accessKey: "",
      secretKey: "",
      region: "",
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      maxSize: 100 * 1024 * 1024, // 100MB in bytes
    },
  },
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(
  userConfig?: NotionCMSConfig
): Required<NotionCMSConfig> {
  if (!userConfig) return DEFAULT_CONFIG;

  const defaultFiles = DEFAULT_CONFIG.files;
  const defaultStorage = defaultFiles.storage!;
  const defaultCache = defaultFiles.cache!;

  return {
    files: {
      strategy: userConfig.files?.strategy ?? defaultFiles.strategy,
      storage: {
        type: userConfig.files?.storage?.type ?? defaultStorage.type,
        path: userConfig.files?.storage?.path ?? defaultStorage.path,
        endpoint:
          userConfig.files?.storage?.endpoint ?? defaultStorage.endpoint,
        bucket: userConfig.files?.storage?.bucket ?? defaultStorage.bucket,
        accessKey:
          userConfig.files?.storage?.accessKey ?? defaultStorage.accessKey,
        secretKey:
          userConfig.files?.storage?.secretKey ?? defaultStorage.secretKey,
        region: userConfig.files?.storage?.region ?? defaultStorage.region,
      },
      cache: {
        ttl: userConfig.files?.cache?.ttl ?? defaultCache.ttl,
        maxSize: userConfig.files?.cache?.maxSize ?? defaultCache.maxSize,
      },
    },
  };
}
