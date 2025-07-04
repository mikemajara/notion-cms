/**
 * Configuration options for NotionCMS file management
 */

const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEFAULT_CACHE_MAX_SIZE = 100 * 1024 * 1024; // 100MB in bytes
const DEFAULT_LOCAL_PATH = "./public/assets";
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
      ttl: number;
      maxSize: number;
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
      path: DEFAULT_LOCAL_PATH,
      endpoint: "",
      bucket: "",
      accessKey: "",
      secretKey: "",
      region: "",
    },
    cache: {
      ttl: DEFAULT_CACHE_TTL,
      maxSize: DEFAULT_CACHE_MAX_SIZE,
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
