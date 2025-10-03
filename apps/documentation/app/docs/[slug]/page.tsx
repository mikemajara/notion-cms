import { NotionCMS } from "@/lib/notion"
import { blocksToMarkdown } from "@mikemajara/notion-cms"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { unstable_cache } from "next/cache"
import { components } from "@/mdx-components"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { ArrowUpRightIcon } from "lucide-react"
import { RecordNotionCMS } from "@/lib/notion"
import cn from "clsx"

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600

export const generateStaticParams = async () => {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
  const pages = await notionCMS
    .query("notionCMS", { recordType: "simple" })
    .all()
  return pages.map((page) => ({ slug: page.slug }))
}

/**
 * Extracts h1, h2 and h3 headings and builds an index of the page
 * - Doesn't match code blocks
 */
const getPageIndex = (content: string) => {
  let contentToParse = content
  contentToParse = contentToParse.replace(/```.*?```/gs, "")
  contentToParse = contentToParse.replace(/`.*?`/gs, "")
  const headings = contentToParse.match(/^#+\s+(.*)$/gm)
  return headings?.map((heading) => ({
    level: heading.match(/^#+/)?.[0].length,
    text: heading.replace(/^#+\s+/, "")
  }))
}

// Cache the page data with tag-based revalidation
const getPageData = (slug: string) =>
  unstable_cache(
    async () => {
      const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
        files: {
          strategy: "local"
        },
        debug: {
          enabled: process.env.DEBUG === "true"
        }
      })
      const page = await notionCMS
        .query("notionCMS", { recordType: "simple" })
        .filter("slug", "equals", slug)
        .single()

      // Fetch page content
      let content = ""
      let hasContent = false

      try {
        const blocks = await notionCMS.getPageContent(page!.id)
        content = blocksToMarkdown(blocks)
        hasContent = blocks.length > 0 && content.trim().length > 0
      } catch (contentError) {
        console.warn("Could not fetch page content:", contentError)
        // Don't fail the whole request if content fetching fails
      }

      return { page, content, hasContent }
    },
    [`docs-page-${slug}`],
    {
      tags: [`docs-${slug}`],
      revalidate: 3600
    }
  )

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const { content, page } = await getPageData(slug)()

  return (
    <div className="py-8 w-full">
      <div className="flex flex-row gap-4">
        <div className="space-y-2 max-w-lg lg:max-w-2xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
          <Link
            href={`https://mikemajara.notion.site/${page.id.replaceAll(
              "-",
              ""
            )}`}
            className="flex gap-2 items-center mt-10 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icons.notion className="w-4 h-4" />
            See in Notion
            <ArrowUpRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="hidden flex-col gap-2 text-sm lg:flex">
          {getPageIndex(content)?.map((heading, idx) => (
            <Link
              key={idx}
              href={`#${heading.text.replaceAll(" ", "-")}`}
              className={cn("hover:underline")}
              style={{ paddingLeft: `${heading.level}rem` }}
            >
              {heading.text}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
