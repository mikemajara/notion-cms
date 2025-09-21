import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"
export type ContentBlockAdvanced =
  | {
      id: string
      type: "paragraph" | "quote"
      text: string
      text_md: string
      children?: ContentBlockAdvanced[]
    }
  | {
      id: string
      type: "heading_1" | "heading_2" | "heading_3"
      text: string
      text_md: string
    }
  | {
      id: string
      type: "bulleted_list_item" | "numbered_list_item" | "toggle"
      text: string
      text_md: string
      children?: ContentBlockAdvanced[]
    }
  | {
      id: string
      type: "to_do"
      checked: boolean
      text: string
      text_md: string
      children?: ContentBlockAdvanced[]
    }
  | {
      id: string
      type: "code"
      language: string
      text: string
      text_md: string
    }
  | {
      id: string
      type: "bookmark" | "embed" | "link_preview"
      url: string
      caption_text?: string
      caption_md?: string
    }
  | {
      id: string
      type: "image" | "video" | "audio" | "file" | "pdf"
      url: string
      caption_text?: string
      caption_md?: string
      expiry_time?: string
    }
  | { id: string; type: "equation"; expression: string }
  | { id: string; type: "divider" }
  | {
      id: string
      type: "table"
      hasColumnHeader: boolean
      hasRowHeader: boolean
      rows: ContentTableRowAdvanced[]
    }
  | {
      id: string
      type: "table_row"
      cells: { text: string; text_md: string }[]
    }
  | {
      id: string
      type: "columns"
      children: { type: "column"; children: ContentBlockAdvanced[] }[]
    }
  | { id: string; type: "column"; children: ContentBlockAdvanced[] }
  | {
      id: string
      type: "synced_block"
      originalBlockId?: string
      children?: ContentBlockAdvanced[]
    }
  | { id: string; type: "child_page"; title?: string; pageId: string }
  | { id: string; type: "child_database"; title?: string; databaseId: string }
  | { id: string; type: "breadcrumb" }
  | { id: string; type: "table_of_contents" }
  | { id: string; type: "template"; children?: ContentBlockAdvanced[] }

export type ContentTableRowAdvanced = Extract<
  ContentBlockAdvanced,
  { type: "table_row" }
>

export type ContentBlockRaw = BlockObjectResponse & {
  children?: ContentBlockRaw[]
}
