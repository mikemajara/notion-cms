import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints"
import { describe, expect, it } from "vitest"

import { blocksToHtml } from "./blocks-to-html"
import { richTextToHtml } from "./rich-text"
import type { NotionBlock, HtmlPlugin } from "./types"

let blockCounter = 0

function createRichText(
  content: string,
  options: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
    code?: boolean
    href?: string | null
    color?: RichTextItemResponse["annotations"]["color"]
  } = {}
): RichTextItemResponse {
  return {
    type: "text",
    text: {
      content,
      link: options.href ? { url: options.href } : null
    },
    annotations: {
      bold: options.bold ?? false,
      italic: options.italic ?? false,
      underline: options.underline ?? false,
      strikethrough: options.strikethrough ?? false,
      code: options.code ?? false,
      color: options.color ?? "default"
    },
    plain_text: content,
    href: options.href ?? null
  } as unknown as RichTextItemResponse
}

function createBlock(
  type: string,
  data: Record<string, any>,
  options: {
    id?: string
    children?: NotionBlock[]
  } = {}
): NotionBlock {
  const children = options.children ?? []
  const base: any = {
    object: "block",
    id: options.id ?? `block-${blockCounter++}`,
    parent: { type: "page_id", page_id: "page-id" },
    created_time: "2024-01-01T00:00:00.000Z",
    last_edited_time: "2024-01-01T00:00:00.000Z",
    created_by: { object: "user", id: "user" },
    last_edited_by: { object: "user", id: "user" },
    has_children: children.length > 0,
    archived: false,
    in_trash: false,
    type,
    [type]: data
  }

  if (children.length > 0) {
    base.children = children
  }

  return base as NotionBlock
}

describe("richTextToHtml", () => {
  it("wraps annotations, links, and escapes characters", () => {
    const html = richTextToHtml([
      createRichText("<script>", { bold: true, href: "https://example.com" }),
      createRichText(" & more", {
        code: true,
        underline: true,
        color: "red"
      })
    ])

    expect(html).toBe(
      '<a href="https://example.com"><strong>&lt;script&gt;</strong></a>' +
        '<span data-color="red"><u><code> &amp; more</code></u></span>'
    )
  })
})

describe("blocksToHtml", () => {
  it("renders a representative collection of blocks", () => {
    const blocks: NotionBlock[] = [
      createBlock("heading_1", {
        rich_text: [createRichText("Hello World")]
      }),
      createBlock("paragraph", {
        rich_text: [
          createRichText("This is "),
          createRichText("bold link", {
            bold: true,
            href: "https://example.com"
          }),
          createRichText(" underline", { underline: true })
        ]
      }),
      createBlock(
        "toggle",
        { rich_text: [createRichText("More")] },
        {
          children: [
            createBlock("paragraph", {
              rich_text: [createRichText("Details")]
            })
          ]
        }
      ),
      createBlock(
        "column_list",
        {},
        {
          children: [
            createBlock(
              "column",
              {},
              {
                children: [
                  createBlock("paragraph", {
                    rich_text: [createRichText("Column A")]
                  })
                ]
              }
            ),
            createBlock(
              "column",
              {},
              {
                children: [
                  createBlock("paragraph", {
                    rich_text: [createRichText("Column B")]
                  })
                ]
              }
            )
          ]
        }
      ),
      createBlock("bulleted_list_item", {
        rich_text: [createRichText("First bullet")]
      }),
      createBlock("bulleted_list_item", {
        rich_text: [createRichText("Second bullet")]
      }),
      createBlock("to_do", {
        rich_text: [createRichText("Task one")],
        checked: false
      }),
      createBlock("to_do", {
        rich_text: [createRichText("Task two")],
        checked: true
      }),
      createBlock(
        "table",
        {
          has_column_header: true,
          has_row_header: false,
          table_width: 2
        },
        {
          children: [
            createBlock("table_row", {
              cells: [
                [createRichText("Header A")],
                [createRichText("Header B")]
              ]
            }),
            createBlock("table_row", {
              cells: [
                [createRichText("Row 1A")],
                [createRichText("Row 1B")]
              ]
            })
          ]
        }
      ),
      createBlock("bookmark", {
        url: "https://example.com",
        caption: [createRichText("Bookmark caption")]
      }),
      createBlock("image", {
        type: "external",
        external: { url: "https://example.com/img.png" },
        caption: [createRichText("Alt text")]
      }),
      createBlock("child_page", { title: "Nested Page" }, { id: "child-page" })
    ]

    const html = blocksToHtml(blocks, {
      debug: true,
      listClassName: "custom-list",
      todoClassName: "custom-todo"
    })

    expect(html).toBe(
      '<h1 data-level="0" data-type="heading_1">Hello World</h1>' +
        '<p data-level="0" data-type="paragraph">This is <a href="https://example.com"><strong>bold link</strong></a><u> underline</u></p>' +
        '<details data-level="0" data-type="toggle"><summary data-level="1" data-type="toggle">More</summary><div data-level="1" data-type="toggle"><p data-level="1" data-type="paragraph">Details</p></div></details>' +
        '<div class="notion-columns" data-level="0" data-type="column_list"><div class="notion-column" data-level="1" data-type="column"><p data-level="2" data-type="paragraph">Column A</p></div><div class="notion-column" data-level="1" data-type="column"><p data-level="2" data-type="paragraph">Column B</p></div></div>' +
        '<ul class="notion-bulleted-list custom-list" data-level="0" data-type="bulleted_list_item"><li data-level="1" data-type="bulleted_list_item">First bullet</li><li data-level="1" data-type="bulleted_list_item">Second bullet</li></ul>' +
        '<ul class="notion-todo-list custom-todo" data-level="0" data-type="to_do"><li data-level="1" data-type="to_do"><input data-level="1" data-type="to_do" disabled type="checkbox" /><span data-level="1" data-type="to_do">Task one</span></li><li data-level="1" data-type="to_do"><input checked data-level="1" data-type="to_do" disabled type="checkbox" /><span data-level="1" data-type="to_do">Task two</span></li></ul>' +
        '<table data-level="0" data-type="table"><thead data-level="1" data-type="table"><tr data-level="2" data-type="table"><th data-level="3" data-type="table">Header A</th><th data-level="3" data-type="table">Header B</th></tr></thead><tbody data-level="1" data-type="table"><tr data-level="2" data-type="table"><td data-level="3" data-type="table">Row 1A</td><td data-level="3" data-type="table">Row 1B</td></tr></tbody></table>' +
        '<figure class="notion-media notion-bookmark" data-level="0" data-type="bookmark"><a data-level="1" data-type="bookmark" href="https://example.com">Bookmark caption</a><figcaption data-level="1" data-type="bookmark">Bookmark caption</figcaption></figure>' +
        '<figure class="notion-media notion-image" data-level="0" data-type="image"><img alt="Alt text" data-level="1" data-type="image" loading="lazy" src="https://example.com/img.png" /><figcaption data-level="1" data-type="image">Alt text</figcaption></figure>' +
        '<div class="notion-debug-placeholder" data-block-id="child-page" data-kind="child_page" data-level="0" data-type="child_page">Nested Page</div>'
    )
  })

  it("omits structural placeholders when debug is disabled", () => {
    const html = blocksToHtml(
      [createBlock("child_page", { title: "Nested Page" })],
      { debug: false }
    )

    expect(html).toBe("")
  })

  it("runs postProcess plugins in order", () => {
    const listBlocks: NotionBlock[] = [
      createBlock("bulleted_list_item", {
        rich_text: [createRichText("Item 1")]
      }),
      createBlock("bulleted_list_item", {
        rich_text: [createRichText("Item 2")]
      }),
      createBlock("bulleted_list_item", {
        rich_text: [createRichText("Item 3")]
      })
    ]

    const alternatingBullets: HtmlPlugin = {
      id: "alternate-bullets",
      postProcess(node, ctx) {
        if (node.kind !== "element") return
        const type = node.attributes["data-type"]
        if (node.tagName === "ul" && type === "bulleted_list_item") {
          const key = `list:${node.meta.blockId ?? ctx.level}`
          ctx.setState(key, 0)
          return
        }

        if (node.tagName !== "li" || type !== "bulleted_list_item") {
          return
        }

        const listAncestor = ctx.ancestors
          .slice()
          .reverse()
          .find(
            (ancestor) =>
              ancestor.tagName === "ul" &&
              ancestor.attributes["data-type"] === "bulleted_list_item"
          )

        const listKey = `list:${listAncestor?.meta.blockId ?? "global"}`
        const count = ctx.getState<number>(listKey) ?? 0
        const next = count + 1
        ctx.setState(listKey, next)
        const style = next % 2 === 0 ? "list-style-type: circle" : "list-style-type: disc"
        node.attributes.style = style
      }
    }

    const html = blocksToHtml(listBlocks, {
      plugins: [alternatingBullets]
    })

    expect(html).toBe(
      '<ul class="notion-bulleted-list" data-level="0" data-type="bulleted_list_item"><li data-level="1" data-type="bulleted_list_item" style="list-style-type: disc">Item 1</li><li data-level="1" data-type="bulleted_list_item" style="list-style-type: circle">Item 2</li><li data-level="1" data-type="bulleted_list_item" style="list-style-type: disc">Item 3</li></ul>'
    )
  })

  it("allows plugins to replace rendered nodes", () => {
    const bookmark = createBlock("bookmark", {
      url: "https://example.com",
      caption: [createRichText("Example Bookmark")]
    })

    const customBookmark: HtmlPlugin = {
      id: "custom-bookmark",
      postProcess(node, ctx) {
        if (node.kind !== "element") return
        if (node.tagName !== "figure") return
        if (node.attributes["data-type"] !== "bookmark") return

        const href = ctx.block && (ctx.block as any).bookmark?.url
        const component = ctx.createElement("Bookmark", {
          href: href ?? ""
        })
        component.children.push(ctx.createText("Custom Bookmark"))
        return component
      }
    }

    const html = blocksToHtml([bookmark], {
      plugins: [customBookmark]
    })

    expect(html).toBe(
      '<Bookmark data-level="0" data-type="bookmark" href="https://example.com">Custom Bookmark</Bookmark>'
    )
  })
})

