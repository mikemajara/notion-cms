import { fontVariables } from "@/lib/fonts"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { cn } from "@/lib/utils"
import { SiteNavbar } from "@/components/site-navbar"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "@/components/theme-provider"
import { ActiveThemeProvider } from "@/components/theme-active"
import { cookies } from "next/headers"
import { Toaster } from "@/components/ui/toaster"
import React from "react"
import { StrategyIndicator } from "@/components/strategy-indicator"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000"
}

export const metadata: Metadata = {
  title: "Next.js Template Collection",
  description:
    "Jump-start your project with three production-ready templates powered by Next.js 15 and Tailwind CSS.",
  metadataBase: new URL("https://nextjs-with-shadcn.vercel.app"),
  authors: [{ name: "Miguel Alcalde" }],
  openGraph: {
    title: "Next.js Template Collection",
    description:
      "Jump-start your project with three production-ready templates powered by Next.js 15 and Tailwind CSS.",
    images: [
      {
        url: "/meta.png",
        width: 1200,
        height: 630,
        alt: "Next.js Template Collection Preview"
      }
    ],
    locale: "en_US",
    type: "website",
    siteName: "Next.js Template Collection"
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js Template Collection",
    description:
      "Jump-start your project with three production-ready templates powered by Next.js 15 and Tailwind CSS.",
    images: ["/meta.png"],
    creator: "@miguelalcalde"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "48x48" }],
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest",
  keywords: [
    "Next.js",
    "React",
    "Tailwind CSS",
    "shadcn/ui",
    "Templates",
    "Web Development"
  ]
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const activeThemeValue = cookieStore.get("active_theme")?.value
  const isScaled = activeThemeValue?.endsWith("-scaled")
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background overscroll-none font-sans antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : "",
          fontVariables
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <ActiveThemeProvider initialTheme={activeThemeValue}>
            <NuqsAdapter>
              <SiteNavbar />
              <StrategyIndicator />
              <main className="w-full min-h-screen pt-14">{children}</main>
            </NuqsAdapter>
            <Toaster />
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
