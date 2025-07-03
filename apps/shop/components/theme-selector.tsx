"use client";

import { THEMES } from "@/lib/themes";
import { useThemeConfig } from "@/components/theme-active";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeCircle } from "@/components/theme-circle";

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const currentTheme = THEMES.find((t) => t.value === activeTheme);

  return (
    <SelectPrimitive.Root value={activeTheme} onValueChange={setActiveTheme}>
      <SelectPrimitive.Trigger className="flex h-8 w-36 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        <div className="flex items-center gap-2">
          <ThemeCircle theme={activeTheme} />
          <span>{currentTheme?.name || "Select a theme"}</span>
        </div>
        <SelectPrimitive.Icon>
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80"
          position="popper"
          align="end"
          sideOffset={5}
        >
          <SelectPrimitive.Viewport className="p-1">
            {THEMES.map((theme) => (
              <SelectPrimitive.Item
                key={theme.value}
                value={theme.value}
                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <ThemeCircle theme={theme.value} />
                  <span>{theme.name}</span>
                </div>
                <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
