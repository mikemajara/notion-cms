import { Markdown } from "@/lib/markdown"
// import { blocksToMarkdown } from "@mikemajara/notion-cms"
import { RecordNotionCMS, NotionCMS } from "@/lib/notion"
import { blocksToHtml } from "@notion-utils/html"
import React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { codeToHtml } from "shiki"
import prettier from "prettier/standalone"
import parserHtml from "prettier/plugins/html"

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
  const formattedHtml = await prettier.format(html, {
    parser: "html",
    plugins: [parserHtml]
  })
  const shikiHtml = await codeToHtml(formattedHtml, {
    lang: "html",
    theme: "github-light"
  })

  return (
    <div className="container flex gap-4 mx-auto min-h-screen">
      <div className="overflow-hidden w-1/2 border">
        <h1>Notion Page</h1>
        <iframe
          className="w-full h-full"
          src="https://mikemajara.notion.site/ebd/29e2a789c1fc8009b74ff8e7aba151ca"
        />
      </div>
      <div className="overflow-hidden overflow-y-scroll p-2 w-1/2 h-screen border">
        <Tabs defaultValue="html">
          <TabsList>
            <TabsTrigger value="html">Plain HTML</TabsTrigger>
            <TabsTrigger value="rendered">Rendered HTML</TabsTrigger>
          </TabsList>
          <TabsContent value="html">
            <div
              className="overflow-x-scroll w-full h-screen [&_.shiki]:bg-transparent!"
              style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: shikiHtml }}
            />
          </TabsContent>
          <TabsContent value="rendered">
            <div className="overflow-y-scroll h-full">
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
