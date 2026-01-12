"use client"

import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import clsx from "clsx"
import {
  FacebookEmbed,
  InstagramEmbed,
  LinkedInEmbed,
  PinterestEmbed,
  TikTokEmbed,
  XEmbed,
  YouTubeEmbed
} from "react-social-media-embed"

interface SocialEmbedHydratorProps {
  html: string
  className?: string
}

type EmbedMatch = (host: string, url: URL) => boolean

interface EmbedDefinition {
  match: EmbedMatch
  render: (url: string) => ReactNode
}

const EMBED_DEFINITIONS: EmbedDefinition[] = [
  {
    match: (host) => /(^|\.)twitter\.com$/.test(host) || /(^|\.)x\.com$/.test(host),
    render: (url) => <XEmbed url={url} width={550} />
  },
  {
    match: (host) => /(^|\.)youtu\.be$/.test(host) || /(^|\.)youtube\.com$/.test(host),
    render: (url) => <YouTubeEmbed url={url} width={560} height={315} />
  },
  {
    match: (host) => /(^|\.)instagram\.com$/.test(host),
    render: (url) => <InstagramEmbed url={url} width={328} />
  },
  {
    match: (host) => /(^|\.)facebook\.com$/.test(host),
    render: (url) => <FacebookEmbed url={url} width={550} />
  },
  {
    match: (host) => /(^|\.)linkedin\.com$/.test(host),
    render: (url) => <LinkedInEmbed url={url} width={560} height={640} />
  },
  {
    match: (host) => /(^|\.)pinterest\./.test(host),
    render: (url) => <PinterestEmbed url={url} width={345} height={480} />
  },
  {
    match: (host) => /(^|\.)tiktok\.com$/.test(host),
    render: (url) => <TikTokEmbed url={url} width={325} />
  }
]

function createEmbedElement(url: string): ReactNode | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase()
  const definition = EMBED_DEFINITIONS.find((entry) => entry.match(host, parsed))
  if (!definition) {
    return null
  }
  return definition.render(url)
}

export default function SocialEmbedHydrator({
  html,
  className
}: SocialEmbedHydratorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rootsRef = useRef<Map<HTMLElement, Root>>(new Map())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const roots = rootsRef.current
    const touchedParents = new Set<HTMLElement>()

    // Clean previous mounts
    roots.forEach((root) => root.unmount())
    roots.clear()

    const placeholders =
      container.querySelectorAll<HTMLElement>("[data-social-embed-target]")

    placeholders.forEach((placeholder) => {
      const parent = placeholder.closest<HTMLElement>("[data-social-embed]")
      if (!parent) return
      const url = parent.dataset.socialEmbedUrl
      if (!url) return

      const embedNode = createEmbedElement(url)
      if (!embedNode) return

      const root = createRoot(placeholder)
      root.render(embedNode)
      roots.set(placeholder, root)

      touchedParents.add(parent)
      parent.dataset.socialEmbedState = "hydrated"
      parent
        .querySelectorAll<HTMLElement>("[data-social-embed-fallback]")
        .forEach((fallback) => {
          fallback.style.display = "none"
        })
    })

    return () => {
      roots.forEach((root) => root.unmount())
      roots.clear()
      touchedParents.forEach((parent) => {
        parent.dataset.socialEmbedState = "pending"
        parent
          .querySelectorAll<HTMLElement>("[data-social-embed-fallback]")
          .forEach((fallback) => {
            fallback.style.removeProperty("display")
          })
      })
    }
  }, [html])

  return (
    <div
      ref={containerRef}
      className={clsx("notion-html-render", className)}
      data-social-embed-container=""
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}


