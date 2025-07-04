"use client";

import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Info } from "lucide-react";
import {
  detectStrategyFromPath,
  generatePLPLink,
  getAllStrategies,
  STRATEGY_CONFIG,
  type FileStrategy,
} from "@/lib/strategy-utils";

export function StrategyIndicator() {
  const pathname = usePathname();
  const router = useRouter();

  const currentStrategy = detectStrategyFromPath(pathname);
  const currentConfig = STRATEGY_CONFIG[currentStrategy];
  const allStrategies = getAllStrategies();

  const handleStrategyChange = (newStrategy: FileStrategy) => {
    const newUrl = generatePLPLink(newStrategy);
    router.push(newUrl);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-background/95 backdrop-blur-sm border shadow-lg cursor-pointer"
          >
            <Info className="h-3 w-3" />
            <span className="px-2 py-0">{currentConfig.badge}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-2">
            <div className="text-sm font-medium">File Handling Strategy</div>
            <div className="text-xs text-muted-foreground mb-3">
              {currentConfig.description}
            </div>

            <div className="space-y-1">
              {allStrategies.map(({ strategy, config }) => (
                <Button
                  key={strategy}
                  variant={strategy === currentStrategy ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2 h-auto py-2"
                  onClick={() => handleStrategyChange(strategy)}
                >
                  <span className="px-2 py-0">{config.badge}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">
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
  );
}
