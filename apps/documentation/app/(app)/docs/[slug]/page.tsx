import { Markdown } from "@/lib/markdown"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { ArrowUpRightIcon } from "lucide-react"
import cn from "clsx"
import { format } from "date-fns"
import { headingSlugFromText } from "@/lib/utils"
import { getDocsPage, getDocsPages } from "@/lib/docs"
import { notFound } from "next/navigation"

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600

export const generateStaticParams = async () => {
  return getDocsPages().map((page) => ({ slug: page.slug }))
}

/**
 * Extracts h1, h2 and h3 headings and builds an index of the page
 * - Doesn't match code blocks
 */
type PageHeading = {
  level: number
  text: string
  slug: string
}

const getPageIndex = (content: string): PageHeading[] | undefined => {
  let contentToParse = content
  contentToParse = contentToParse.replace(/```[\s\S]*?```/g, "")
  contentToParse = contentToParse.replace(/`([^`]*)`/g, "$1")
  const headings = contentToParse.match(/^#{1,3}\s+(.*)$/gm)

  return headings
    ?.map((heading) => {
      const level = heading.match(/^#+/)?.[0].length ?? 0
      const text = heading.replace(/^#+\s+/, "").trim()
      const slug = headingSlugFromText(text)

      if (!level || !slug) {
        return undefined
      }

      return { level, text, slug }
    })
    .filter((heading): heading is PageHeading => Boolean(heading))
}

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const page = getDocsPage(slug)

  if (!page) {
    notFound()
  }

  const content = page.content

  return (
    <div className="w-full">
      <div className="flex flex-row gap-4">
        <div className="px-6 py-6 space-y-2 max-w-lg min-h-screen lg:max-w-2xl min-w-lg">
          <Markdown>{content}</Markdown>
          <div className="flex flex-row justify-between items-center mt-10">
            <div className="flex gap-2 items-center">
              <Link
                href={`https://github.com/mikemajara/notion-cms/blob/notion-v5.1/packages/notion-cms/docs/${page.fileName}`}
                className="flex gap-2 items-center hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.notion className="w-4 h-4" />
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
                Last updated: {format(page.updatedAt, "PPp")}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden flex-col gap-2 py-14 text-sm border-l md:flex md:w-48 lg:w-60">
          {getPageIndex(content)?.map((heading, idx) => (
            <Link
              key={idx}
              href={`#${heading.slug}`}
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
