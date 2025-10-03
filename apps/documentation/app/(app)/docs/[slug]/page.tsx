import { NotionCMS } from "@/lib/notion"
import { blocksToMarkdown } from "@mikemajara/notion-cms"
import { Markdown } from "@/lib/markdown"
import remarkGfm from "remark-gfm"
import { unstable_cache } from "next/cache"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { ArrowUpRightIcon } from "lucide-react"
import { RecordNotionCMS } from "@/lib/notion"
import cn from "clsx"
import { format } from "date-fns"

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

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const fetchContent = unstable_cache(
    async () => {
      const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
      const page = (await notionCMS
        .query("notionCMS", { recordType: "simple" })
        .filter("slug", "equals", slug)
        .single()!) as RecordNotionCMS
      const content = blocksToMarkdown(await notionCMS.getPageContent(page.id))
      return { content, page }
    },
    [`docs-page-${slug}`],
    {
      tags: [`docs-${slug}`],
      revalidate: 3600
    }
  )
  const { content, page } = await fetchContent()

  return (
    <div className="w-full">
      <div className="flex flex-row gap-4">
        <div className="px-6 py-6 space-y-2 max-w-lg border-r lg:max-w-2xl">
          <Markdown>{content}</Markdown>
          <div className="flex flex-row justify-between items-center mt-10">
            <div className="flex gap-2 items-center">
              <Link
                href={`https://mikemajara.notion.site/${page.id.replaceAll(
                  "-",
                  ""
                )}`}
                className="flex gap-2 items-center hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.notion className="w-4 h-4" />
                {/* See in Notion */}
                <ArrowUpRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href={`/docs/${page.slug}/llms.txt`}
                className="flex gap-2 items-center hover:underline"
              >
                LLMs.txt
                <ArrowUpRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div>
              <p>
                Last updated:{" "}
                {page["Last updated"] && format(page["Last updated"], "PPp")}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden flex-col gap-2 py-14 text-sm lg:flex">
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
