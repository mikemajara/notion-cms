import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints"
import { describe, expect, it } from "vitest"

import { blocksToHtml } from "./blocks-to-html"
import { richTextToHtml } from "./rich-text"
import type { NotionBlock } from "./types"

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
      '<h1>Hello World</h1>' +
        '<p>This is <a href="https://example.com"><strong>bold link</strong></a><u> underline</u></p>' +
        '<details><summary>More</summary><div><p>Details</p></div></details>' +
        '<div class="notion-columns"><div class="notion-column"><p>Column A</p></div><div class="notion-column"><p>Column B</p></div></div>' +
        '<ul class="notion-bulleted-list custom-list"><li>First bullet</li><li>Second bullet</li></ul>' +
        '<ul class="notion-todo-list custom-todo"><li><input type="checkbox" disabled /><span>Task one</span></li><li><input type="checkbox" checked disabled /><span>Task two</span></li></ul>' +
        '<table><thead><tr><th>Header A</th><th>Header B</th></tr></thead><tbody><tr><td>Row 1A</td><td>Row 1B</td></tr></tbody></table>' +
        '<figure class="notion-media notion-bookmark"><a href="https://example.com">Bookmark caption</a><figcaption>Bookmark caption</figcaption></figure>' +
        '<figure class="notion-media notion-image"><img src="https://example.com/img.png" alt="Alt text" loading="lazy" /><figcaption>Alt text</figcaption></figure>' +
        '<div class="notion-debug-placeholder" data-kind="child_page" data-block-id="child-page">Nested Page</div>'
    )
  })

  it("omits structural placeholders when debug is disabled", () => {
    const html = blocksToHtml(
      [createBlock("child_page", { title: "Nested Page" })],
      { debug: false }
    )

    expect(html).toBe("")
  })
})

