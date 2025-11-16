import { Markdown } from "@/lib/markdown"
// import { blocksToMarkdown } from "@mikemajara/notion-cms"
import { RecordNotionCMS, NotionCMS } from "@/lib/notion"
import { blocksToHtml } from "@notion-utils/html"
import React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default async function page() {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
  const page = (await notionCMS
    .query("notionCMS", { recordType: "simple" })
    .filter("_slug", "equals", "markdown")
    .maybeSingle()) as RecordNotionCMS
  if (!page) {
    return <div>Page not found</div>
  }
  const content = await notionCMS.getPageContent(page.id as string)
  const html = await blocksToHtml(content)
  return (
    <div className="container flex gap-4 mx-auto">
      <div className="w-1/2 border">
        <h1>Notion Page</h1>
        <iframe
          className="w-full h-full"
          src="https://mikemajara.notion.site/ebd/29e2a789c1fc8009b74ff8e7aba151ca"
        />
      </div>
      <div className="p-2 w-1/2 border">
        <Tabs defaultValue="html">
          <TabsList>
            <TabsTrigger value="html">Plain HTML</TabsTrigger>
            <TabsTrigger value="rendered">Rendered HTML</TabsTrigger>
          </TabsList>
          <TabsContent value="html">
            <div className="">
              <h1>Plain HTML text</h1>
              <div>
                <pre
                  style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
                  className="font-light"
                >
                  <code className="language-html">{html}</code>
                </pre>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="rendered">
            <div className="">
              <h1>Rendered HTML text</h1>
              <div className="prose">
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
