import { NotionCMS } from "@/lib/notion"
import { blocksToMarkdown } from "@mikemajara/notion-cms"
import { RecordNotionCMS } from "@/lib/notion"

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600

export const generateStaticParams = async () => {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
  const pages = await notionCMS
    .query("notionCMS", { recordType: "simple" })
    .all()
  return pages.map((page) => ({ slug: page.slug }))
}

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
    files: { strategy: "local" }
  })
  const { id } = (await notionCMS
    .query("notionCMS", { recordType: "simple" })
    .filter("slug", "equals", slug)
    .single()!) as RecordNotionCMS
  const content = blocksToMarkdown(await notionCMS.getPageContent(id))
  return (
    <pre style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}>
      {content}
    </pre>
  )
}
