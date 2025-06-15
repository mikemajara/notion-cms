import type { Metadata, Viewport } from "next";

// @ts-expect-error types are not available yet?
import { unstable_ViewTransition as ViewTransition } from "react";

import cn from "clsx";
import "katex/dist/katex.min.css";

import Navbar from "@/components/navbar";
import "./globals.css";
import { NotionCMS } from "@mikemajara/notion-cms";
// Import the generated file to register the queryNotionCMS method
import "@/notion/notion-types-nocms";

export const metadata: Metadata = {
  title: {
    template: "%s - Notion CMS",
    default: "Notion CMS - Simplify Notion as a Headless CMS",
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
    "content management",
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
      "max-snippet": -1,
    },
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
        alt: "Notion CMS - Simplify Notion as a Headless CMS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notion CMS - Simplify Notion as a Headless CMS",
    description:
      "A powerful library that simplifies the Notion API to facilitate developer experience when using Notion as a headless CMS.",
    images: ["https://notion-cms.vercel.app/og-image.png"],
    creator: "@mikemajara",
  },
  alternates: {
    canonical: "https://notion-cms.vercel.app",
  },
  category: "technology",
};

export const viewport: Viewport = {
  maximumScale: 1,
  colorScheme: "only light",
  themeColor: "#fcfcfc",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!);
  const pages = await notionCMS
    .queryNoCMS(process.env.NOTION_CMS_DATABASE_ID!)
    .sort("Order", "ascending")
    .all();
  return (
    <html lang="en" className="overflow-x-hidden touch-manipulation">
      <body
        className={cn(
          "w-full p-y-6 p-x-2",
          "text-sm leading-6 sm:text-[15px] sm:leading-7 md:text-base md:leading-7",
          "text-rurikon-500",
          "antialiased"
        )}
      >
        <div className="fixed top-0 left-0 z-30 w-full h-6 pointer-events-none sm:hidden sm:h-10 md:h-14 content-fade-out" />
        <div className="flex flex-col mobile:flex-row">
          <Navbar pages={pages} />
          <main className="relative flex-1 max-w-2xl [contain:inline-size]">
            <div className="absolute right-0 w-full h-px opacity-50 bg-rurikon-border mobile:right-auto mobile:left-0 mobile:w-px mobile:h-full mobile:opacity-100" />
            <ViewTransition name="crossfade">
              <article className="pt-6 pl-0 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
                {children}
              </article>
            </ViewTransition>
          </main>
        </div>
      </body>
    </html>
  );
}
