export type FileStrategy = "direct" | "local" | "remote"

export interface StrategyConfig {
  label: string
  description: string
  badge: string
}

export const STRATEGY_CONFIG: Record<FileStrategy, StrategyConfig> = {
  direct: {
    label: "Direct",
    description: "Original Notion URLs",
    badge: "Direct"
  },
  local: {
    label: "Cache Local",
    description: "Files cached locally",
    badge: "Local"
  },
  remote: {
    label: "Cache Remote",
    description: "Files cached in S3",
    badge: "Remote"
  }
}

/**
 * Detect current file strategy from pathname
 */
export function detectStrategyFromPath(pathname: string): FileStrategy {
  // Remove leading slash and split by '/'
  const segments = pathname.replace(/^\//, "").split("/")

  return segments[0] as FileStrategy
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
      return `direct/artwork/${productId}`
    case "local":
      return `local/artwork/${productId}`
    case "remote":
      return `remote/artwork/${productId}`
    default:
      return `direct/artwork/${productId}`
  }
}

/**
 * Generate PLP (Product List Page) URL for strategy
 */
export function changeStrategyUrl(
  strategy: FileStrategy,
  pathname: string
): string {
  return pathname.replace(/(direct|local|remote)/, strategy)
}

/**
 * Get all available strategies for strategy switcher
 */
export function getAllStrategies(): Array<{
  strategy: FileStrategy
  config: StrategyConfig
}> {
  return Object.entries(STRATEGY_CONFIG).map(([strategy, config]) => ({
    strategy: strategy as FileStrategy,
    config
  }))
}
