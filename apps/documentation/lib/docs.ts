import fs from "node:fs"
import path from "node:path"

const DOCS_PATH = path.join(process.cwd(), "../../packages/notion-cms/docs")

export type DocsPage = {
  slug: string
  title: string
  order: number
  fileName: string
  content: string
  sourcePath: string
  updatedAt: Date
}

export type DocsPageSummary = Pick<DocsPage, "slug" | "title" | "order">

const DOCS_SLUG_ALIASES: Record<string, string> = {
  introduction: "getting-started"
}

function parseDocFile(fileName: string): { order: number; slug: string } {
  const baseName = fileName.replace(/\.md$/i, "")
  const match = baseName.match(/^(\d+)-(.+)$/)

  if (!match) {
    return { order: Number.MAX_SAFE_INTEGER, slug: baseName.toLowerCase() }
  }

  return {
    order: Number(match[1]),
    slug: match[2].toLowerCase()
  }
}

function readTitleFromMarkdown(content: string, fallbackSlug: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (heading) return heading

  return fallbackSlug
    .split("-")
    .map((fragment) => fragment.charAt(0).toUpperCase() + fragment.slice(1))
    .join(" ")
}

function readDocsFiles(): DocsPage[] {
  if (!fs.existsSync(DOCS_PATH)) {
    return []
  }

  const fileNames = fs
    .readdirSync(DOCS_PATH)
    .filter((fileName) => fileName.endsWith(".md"))

  const pages: DocsPage[] = []

  for (const fileName of fileNames) {
    const parsed = parseDocFile(fileName)
    const sourcePath = path.join(DOCS_PATH, fileName)
    const content = fs.readFileSync(sourcePath, "utf8")
    const stat = fs.statSync(sourcePath)

    pages.push({
      slug: parsed.slug,
      order: parsed.order,
      fileName,
      title: readTitleFromMarkdown(content, parsed.slug),
      content,
      sourcePath,
      updatedAt: stat.mtime
    })
  }

  return pages.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

export function getDocsPages(): DocsPageSummary[] {
  return readDocsFiles().map(({ slug, title, order }) => ({ slug, title, order }))
}

export function getDocsPage(slug: string): DocsPage | null {
  const canonicalSlug = DOCS_SLUG_ALIASES[slug] ?? slug
  const pages = readDocsFiles()
  return pages.find((page) => page.slug === canonicalSlug) ?? null
}
