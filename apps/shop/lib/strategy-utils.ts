export type FileStrategy = "direct" | "cache-local" | "cache-remote";

export interface StrategyConfig {
  label: string;
  description: string;
  badge: string;
}

export const STRATEGY_CONFIG: Record<FileStrategy, StrategyConfig> = {
  direct: {
    label: "Direct",
    description: "Original Notion URLs",
    badge: "Direct",
  },
  "cache-local": {
    label: "Cache Local",
    description: "Files cached locally",
    badge: "Local",
  },
  "cache-remote": {
    label: "Cache Remote",
    description: "Files cached in S3",
    badge: "Remote",
  },
};

/**
 * Detect current file strategy from pathname
 */
export function detectStrategyFromPath(pathname: string): FileStrategy {
  // Remove leading slash and split by '/'
  const segments = pathname.replace(/^\//, "").split("/");

  // Check for cache strategies
  if (segments[0] === "cache") {
    if (segments[1] === "local") return "cache-local";
    if (segments[1] === "remote") return "cache-remote";
  }

  // Check for direct strategy
  if (segments[0] === "direct") return "direct";

  // Check for artwork routes with strategy
  if (segments[0] === "artwork" && segments[2]) {
    if (segments[2] === "direct") return "direct";
    if (segments[2] === "cache" && segments[3] === "local")
      return "cache-local";
    if (segments[2] === "cache" && segments[3] === "remote")
      return "cache-remote";
  }

  // Default fallback
  return "direct";
}

/**
 * Generate product link URL based on current strategy
 */
export function generateProductLink(
  productId: string,
  strategy: FileStrategy
): string {
  switch (strategy) {
    case "direct":
      return `/artwork/${productId}/direct`;
    case "cache-local":
      return `/artwork/${productId}/cache/local`;
    case "cache-remote":
      return `/artwork/${productId}/cache/remote`;
    default:
      return `/artwork/${productId}/direct`;
  }
}

/**
 * Generate PLP (Product List Page) URL for strategy
 */
export function generatePLPLink(strategy: FileStrategy): string {
  switch (strategy) {
    case "direct":
      return "/direct";
    case "cache-local":
      return "/cache/local";
    case "cache-remote":
      return "/cache/remote";
    default:
      return "/direct";
  }
}

/**
 * Get all available strategies for strategy switcher
 */
export function getAllStrategies(): Array<{
  strategy: FileStrategy;
  config: StrategyConfig;
}> {
  return Object.entries(STRATEGY_CONFIG).map(([strategy, config]) => ({
    strategy: strategy as FileStrategy,
    config,
  }));
}
