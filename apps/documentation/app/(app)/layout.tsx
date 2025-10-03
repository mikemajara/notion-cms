import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

// @ts-expect-error types are not available yet?
import { unstable_ViewTransition as ViewTransition } from "react"

import cn from "clsx"
import "katex/dist/katex.min.css"

import Navbar from "@/components/navbar"
import "@/styles/globals.css"
import { NotionCMS } from "@/lib/notion"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist"
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
})

export const metadata: Metadata = {
  title: {
    template: "%s - Notion CMS",
    default: "Notion CMS - Simplify Notion as a Headless CMS"
  },
  description:
    "A powerful library that simplifies the Notion API to facilitate developer experience when using Notion as a headless CMS. Query your Notion databases with ease and get type-safe results.",
  keywords: [
    "notion",
    "cms",
    "headless cms",
    "notion api",
    "typescript",
    "database",
    "content management"
  ],
  authors: [{ name: "Mike Majara", url: "https://github.com/mikemajara" }],
  creator: "Mike Majara",
  publisher: "NoCMS",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://notion-cms.vercel.app",
    siteName: "Notion CMS",
    title: "Notion CMS - Simplify Notion as a Headless CMS",
    description:
      "A powerful library that simplifies the Notion API to facilitate developer experience when using Notion as a headless CMS.",
    images: [
      {
        url: "https://notion-cms.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Notion CMS - Simplify Notion as a Headless CMS"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Notion CMS - Simplify Notion as a Headless CMS",
    description:
      "A powerful library that simplifies the Notion API to facilitate developer experience when using Notion as a headless CMS.",
    images: ["https://notion-cms.vercel.app/og-image.png"],
    creator: "@mikemajara"
  },
  alternates: {
    canonical: "https://notion-cms.vercel.app"
  },
  category: "technology"
}

export const viewport: Viewport = {
  maximumScale: 1,
  colorScheme: "only light",
  themeColor: "#fcfcfc"
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
  const pages = await notionCMS
    .query("notionCMS", { recordType: "simple" })
    .sort("Order", "ascending")
    .all()

  return (
    <html lang="en" className="overflow-x-hidden touch-manipulation">
      <body
        className={cn(
          "w-full",
          "text-neutral-500",
          "antialiased",
          geist.variable,
          geistMono.variable
        )}
      >
        <div className="flex flex-col sm:flex-row">
          <Navbar pages={pages} />
          <main className="relative flex-1 min-h-screen">
            <ViewTransition name="crossfade">
              <article className="px-6 py-6 sm:py-3 md:py-2 sm:px-10 md:px-6">
                {children}
              </article>
            </ViewTransition>
          </main>
        </div>
      </body>
    </html>
  )
}
