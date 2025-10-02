"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Info } from "lucide-react"
import {
  detectStrategyFromPath,
  changeStrategyUrl,
  getAllStrategies,
  STRATEGY_CONFIG,
  type FileStrategy
} from "@/lib/strategy-utils"

export function StrategyIndicator() {
  const pathname = usePathname()
  const router = useRouter()

  const currentStrategy = detectStrategyFromPath(pathname)
  const currentConfig = STRATEGY_CONFIG[currentStrategy]
  const allStrategies = getAllStrategies()

  const handleStrategyChange = (newStrategy: FileStrategy) => {
    const newUrl = changeStrategyUrl(newStrategy, pathname)
    router.push(newUrl)
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border shadow-lg backdrop-blur-sm cursor-pointer bg-background/95"
          >
            <Info className="w-3 h-3" />
            <span className="px-2 py-0">{currentConfig.badge}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-64" align="end">
          <div className="space-y-2">
            <div className="text-sm font-medium">File Handling Strategy</div>

            <div className="space-y-1">
              {allStrategies.map(({ strategy, config }) => (
                <Button
                  key={strategy}
                  variant={strategy === currentStrategy ? "default" : "ghost"}
                  size="sm"
                  className="flex flex-col gap-2 justify-start items-start py-2 w-full h-auto"
                  onClick={() => handleStrategyChange(strategy)}
                >
                  <span className="">{config.badge}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground/80">
                      {config.description}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
