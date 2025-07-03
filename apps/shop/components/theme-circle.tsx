"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ThemeCircleProps {
  theme: string;
  className?: string;
}

export function ThemeCircle({ theme, className }: ThemeCircleProps) {
  return (
    <div
      className={cn(
        "relative h-5 w-5 overflow-hidden border rounded",
        `theme-${theme}`,
        className
      )}
    >
      <div className="absolute inset-0 h-full w-full bg-background">
        <div className="absolute bottom-0 right-0 h-1/2 w-1/2 bg-primary" />
        <div className="absolute top-0 left-0 h-1/2 w-1/2 bg-card" />
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-accent" />
        <div className="absolute top-0 right-0 h-1/2 w-1/2 bg-secondary" />
      </div>
    </div>
  );
}
