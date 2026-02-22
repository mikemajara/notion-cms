// import { blocksToMarkdown } from "@mikemajara/notion-cms"
import { RecordNotionCMS, NotionCMS } from "@/lib/notion"
import { blocksToHtml, type HtmlPlugin } from "@notion-utils/html"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { codeToHtml } from "shiki"
import prettier from "prettier/standalone"
import parserHtml from "prettier/plugins/html"
import SocialEmbedHydrator from "./social-embed-hydrator"

const bookmarkSocialEmbedPlugin: HtmlPlugin = {
  id: "bookmark-social-embed",
  priority: 50,
  postProcess(node, ctx) {
    if (node.kind !== "element") return
    if (node.tagName !== "figure") return
    if (node.attributes["data-type"] !== "bookmark") return

    const bookmarkUrl =
      (ctx.block && (ctx.block as any)?.bookmark?.url) ??
      node.attributes["data-bookmark-url"]
    if (!bookmarkUrl) return

    node.attributes["data-social-embed"] = "bookmark"
    node.attributes["data-social-embed-url"] = bookmarkUrl
    if (!node.attributes["data-social-embed-state"]) {
      node.attributes["data-social-embed-state"] = "pending"
    }

    const placeholderLevel = (node.meta.level ?? 0) + 1

    const hasPlaceholder = node.children.some(
      (child) =>
        child.kind === "element" &&
        child.attributes["data-social-embed-target"] !== undefined
    )

    if (!hasPlaceholder) {
      const placeholder = ctx.createElement("div", {
        "data-social-embed-target": "",
        style:
          "min-height: 120px; display: flex; align-items: center; justify-content: center;"
      })
      placeholder.meta.level = placeholderLevel
      placeholder.attributes["data-level"] = String(placeholderLevel)
      node.children = [placeholder, ...node.children]
    }

    node.children = node.children.map((child) => {
      if (
        child.kind === "element" &&
        child.tagName === "a" &&
        !child.attributes["data-social-embed-fallback"]
      ) {
        return {
          ...child,
          attributes: {
            ...child.attributes,
            "data-social-embed-fallback": "link"
          }
        }
      }
      return child
    })
  }
}

export default async function page() {
  try {
    const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
    const page = (await notionCMS
      .query("notionCMS", { recordType: "simple" })
      .filter("_slug", "equals", "markdown")
      .maybeSingle()) as RecordNotionCMS
    if (!page) {
      return <div>Page not found</div>
    }
    const content = await notionCMS.getPageContent(page.id as string)
    const shikiContent = await codeToHtml(JSON.stringify(content, null, 2), {
      lang: "json",
      theme: "github-light"
    })
    const html = await blocksToHtml(content, {
      plugins: [bookmarkSocialEmbedPlugin]
    })
    const formattedHtml = await prettier.format(html, {
      parser: "html",
      plugins: [parserHtml]
    })
    const shikiHtml = await codeToHtml(formattedHtml, {
      lang: "html",
      theme: "github-light"
    })

    return (
      <div className="container flex gap-4 mx-auto h-screen">
        <div className="overflow-hidden w-1/2 h-full border">
          <Tabs defaultValue="notion">
            <TabsList>
              <TabsTrigger value="notion">Notion Page</TabsTrigger>
              <TabsTrigger value="blocks">Notion Blocks</TabsTrigger>
            </TabsList>
            <TabsContent value="notion">
              <div className="h-screen">
                <iframe
                  className="w-full h-full"
                  src="https://mikemajara.notion.site/ebd/29e2a789c1fc8009b74ff8e7aba151ca"
                />
              </div>
            </TabsContent>
            <TabsContent value="blocks">
              <div className="overflow-y-scroll h-screen">
                <div dangerouslySetInnerHTML={{ __html: shikiContent }} />
              </div>
            </TabsContent>
          </Tabs>
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
                <SocialEmbedHydrator className="prose" html={html} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="container py-10 mx-auto">
        <h1 className="text-xl font-semibold">HTML playground unavailable</h1>
        <p className="mt-2">
          Configure a valid <code>NOTION_API_KEY</code> to render this page.
        </p>
      </div>
    )
  }
}
