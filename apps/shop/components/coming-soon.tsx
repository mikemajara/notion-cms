"use client";
import { useState, useEffect } from "react";
import { CountdownTimer } from "./countdown-timer";
import { NewsletterForm } from "./newsletter-form";
import { cn } from "@/lib/utils";

export default function ComingSoon() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl mx-auto">
        <div className="space-y-2">
          <h1
            className={cn(
              "text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl",
              "opacity-0 translate-y-4 transition-all duration-1000",
              isMounted && "opacity-100 translate-y-0"
            )}
          >
            Something Amazing
            <br />
            is Coming Soon
          </h1>
          <p
            className={cn(
              "text-neutral-500 text-xl dark:text-neutral-400",
              "opacity-0 translate-y-4 transition-all duration-1000 delay-300",
              isMounted && "opacity-100 translate-y-0"
            )}
          >
            We&apos;re crafting a unique blogging experience just for you.
          </p>
        </div>

        <div
          className={cn(
            "opacity-0 translate-y-4 transition-all duration-1000 delay-500",
            isMounted && "opacity-100 translate-y-0"
          )}
        >
          <CountdownTimer />
        </div>

        <div
          className={cn(
            "opacity-0 translate-y-4 transition-all duration-1000 delay-700",
            isMounted && "opacity-100 translate-y-0"
          )}
        >
          <NewsletterForm />
        </div>
      </div>

      <div
        className={cn(
          "fixed bottom-4 text-center text-sm text-neutral-500 dark:text-neutral-400",
          "opacity-0 translate-y-4 transition-all duration-1000 delay-1000",
          isMounted && "opacity-100 translate-y-0"
        )}
      >
        © {new Date().getFullYear()} Your Blog Name. All rights reserved.
      </div>
    </div>
  );
}
