"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const launchDate = new Date(
      new Date().setHours(0, 0, 0, 0) + 30 * 24 * 60 * 60 * 1000
    );

    const timer = setInterval(() => {
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500">
      <div className="text-center">
        <div className="text-3xl font-bold">{timeLeft.days}</div>
        <div className="text-xs text-neutral-500 uppercase dark:text-neutral-400">
          Days
        </div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{timeLeft.hours}</div>
        <div className="text-xs text-neutral-500 uppercase dark:text-neutral-400">
          Hours
        </div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{timeLeft.minutes}</div>
        <div className="text-xs text-neutral-500 uppercase dark:text-neutral-400">
          Minutes
        </div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{timeLeft.seconds}</div>
        <div className="text-xs text-neutral-500 uppercase dark:text-neutral-400">
          Seconds
        </div>
      </div>
    </Card>
  );
}
