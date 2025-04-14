"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInterval } from "react-use";
import { ShoppingBag, Mail, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [dots, setDots] = useState("...");
  // launch date is 30 days from now always, counting from the beginning of the current day
  const launchDate = new Date(
    new Date().setHours(0, 0, 0, 0) + 30 * 24 * 60 * 60 * 1000
  );
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = new Date();
    const difference = launchDate.getTime() - now.getTime();

    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  useInterval(() => {
    setTimeLeft(getTimeLeft());
  }, 1000);

  // useInterval(() => {
  //   setDots((dots) => (dots.length >= 3 ? "." : dots + "."));
  // }, 500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "You're on the list!",
        description: "We'll let you know when we launch.",
        action: <ToastAction altText="Close">Close</ToastAction>,
      });
      setEmail("");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-2xl mx-auto"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-4xl md:text-5xl font-bold">
            <ShoppingBag className="w-12 h-12" />
            <h1>StyleSpace</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Your new favorite fashion destination{dots}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xs mx-auto md:max-w-2xl">
          {Object.entries(timeLeft).map(([label, value]) => (
            <div
              key={label}
              className="bg-card p-3 rounded-lg shadow-lg border"
            >
              <div className="text-2xl md:text-3xl font-mono tabular-nums">
                {String(value).padStart(2, "0")}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {label}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
        >
          <div className="flex-1">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit">
            <Mail className="mr-2 h-4 w-4" />
            Notify me
          </Button>
        </form>

        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Follow us on Instagram"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Follow us on Twitter"
          >
            <Twitter className="w-6 h-6" />
          </a>
        </div>

        <motion.div
          // animate={{
          //   // scale: [1, 1.05, 1],
          //   rotate: [0, 5, -5, 0],
          // }}
          // transition={{
          //   duration: 2,
          //   repeat: Infinity,
          //   repeatType: "reverse",
          // }}
          className="text-muted-foreground text-sm"
        >
          Something amazing is coming...
        </motion.div>
      </motion.div>
    </div>
  );
}
