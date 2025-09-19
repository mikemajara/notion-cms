import type { ContentBlockAdvanced, ContentBlockRaw } from "../../content-types"
import { richTextToMarkdown, richTextToPlain } from "../../utils/rich-text"

export interface RawAdvancedOptions {
  mediaUrlResolver?: (
    block: ContentBlockRaw,
    field: any
  ) => string | Promise<string>
}

function getBlockType(block: ContentBlockRaw): string {
  return (block as any).type as string
}

function getField<T = any>(block: ContentBlockRaw): T | undefined {
  return (block as any)[getBlockType(block)] as T
}

async function resolveMediaUrl(
  block: ContentBlockRaw,
  field: any,
  options: RawAdvancedOptions
): Promise<string> {
  if (options.mediaUrlResolver) {
    const fromResolver = await options.mediaUrlResolver(block, field)
    if (fromResolver) return fromResolver
  }
  if (!field) return ""
  return field?.type === "external"
    ? field?.external?.url ?? ""
    : field?.file?.url ?? ""
}

async function mapBlock(
  block: ContentBlockRaw,
  options: RawAdvancedOptions
): Promise<ContentBlockAdvanced | null> {
  const type = getBlockType(block)
  const field = getField<any>(block)
  const childRaw =
    ((block as any).children as ContentBlockRaw[] | undefined) || []
  const childAdvanced = await mapBlocks(childRaw, options)

  switch (type) {
    case "paragraph":
    case "quote": {
      const text = richTextToPlain(field?.rich_text ?? [])
      const text_md = richTextToMarkdown(field?.rich_text ?? [])
      return {
        id: block.id,
        type,
        text,
        text_md,
        children: childAdvanced.length ? childAdvanced : undefined
      } as ContentBlockAdvanced
    }
    case "heading_1":
    case "heading_2":
    case "heading_3": {
      const text = richTextToPlain(field?.rich_text ?? [])
      const text_md = richTextToMarkdown(field?.rich_text ?? [])
      return { id: block.id, type, text, text_md } as ContentBlockAdvanced
    }
    case "bulleted_list_item":
    case "numbered_list_item":
    case "toggle": {
      const text = richTextToPlain(field?.rich_text ?? [])
      const text_md = richTextToMarkdown(field?.rich_text ?? [])
      return {
        id: block.id,
        type,
        text,
        text_md,
        children: childAdvanced.length ? childAdvanced : undefined
      } as ContentBlockAdvanced
    }
    case "to_do": {
      const text = richTextToPlain(field?.rich_text ?? [])
      const text_md = richTextToMarkdown(field?.rich_text ?? [])
      const checked = Boolean(field?.checked)
      return {
        id: block.id,
        type,
        checked,
        text,
        text_md,
        children: childAdvanced.length ? childAdvanced : undefined
      } as ContentBlockAdvanced
    }
    case "code": {
      const language = field?.language || ""
      const text = richTextToPlain(field?.rich_text ?? [])
      const text_md = richTextToMarkdown(field?.rich_text ?? [])
      return {
        id: block.id,
        type,
        language,
        text,
        text_md
      } as ContentBlockAdvanced
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const url = field?.url || ""
      const caption_text = richTextToPlain(field?.caption ?? []) || undefined
      const caption_md = richTextToMarkdown(field?.caption ?? []) || undefined
      return {
        id: block.id,
        type,
        url,
        caption_text,
        caption_md
      } as ContentBlockAdvanced
    }
    case "image":
    case "video":
    case "audio":
    case "file":
    case "pdf": {
      const url = await resolveMediaUrl(block, field, options)
      const caption_text = richTextToPlain(field?.caption ?? []) || undefined
      const caption_md = richTextToMarkdown(field?.caption ?? []) || undefined
      const expiry_time = field?.file?.expiry_time || undefined
      return {
        id: block.id,
        type,
        url,
        caption_text,
        caption_md,
        expiry_time
      } as ContentBlockAdvanced
    }
    case "equation": {
      const expression = field?.expression || ""
      return { id: block.id, type, expression } as ContentBlockAdvanced
    }
    case "divider": {
      return { id: block.id, type } as ContentBlockAdvanced
    }
    case "table": {
      const hasColumnHeader = Boolean(field?.has_column_header)
      const hasRowHeader = Boolean(field?.has_row_header)
      const rows: ContentBlockAdvanced[] = await mapBlocks(childRaw, options)
      const rowBlocks = rows.filter(
        (r) => (r as any).type === "table_row"
      ) as Extract<ContentBlockAdvanced, { type: "table_row" }>[]
      return {
        id: block.id,
        type,
        hasColumnHeader,
        hasRowHeader,
        rows: rowBlocks
      } as ContentBlockAdvanced
    }
    case "table_row": {
      const cells: { text: string; text_md: string }[] =
        (field?.cells as any[] | undefined)?.map((c) => {
          const rich = Array.isArray(c) ? (c as any[]) : []
          return {
            text: richTextToPlain(rich),
            text_md: richTextToMarkdown(rich)
          }
        }) ?? []
      return { id: block.id, type, cells } as ContentBlockAdvanced
    }
    case "columns": {
      const children = childAdvanced.length ? childAdvanced : []
      const columns = children
        .filter((c) => (c as any).type === "column")
        .map((c) => ({
          type: "column",
          children: ((c as any).children || []) as ContentBlockAdvanced[]
        }))
      return {
        id: block.id,
        type: "columns",
        children: columns
      } as ContentBlockAdvanced
    }
    case "column": {
      return {
        id: block.id,
        type,
        children: childAdvanced.length ? childAdvanced : []
      } as ContentBlockAdvanced
    }
    case "synced_block": {
      const originalBlockId = field?.synced_from?.block_id || undefined
      return {
        id: block.id,
        type,
        originalBlockId,
        children: childAdvanced.length ? childAdvanced : undefined
      } as ContentBlockAdvanced
    }
    case "child_page": {
      const title = (field?.title as string | undefined) || undefined
      return {
        id: block.id,
        type,
        title,
        pageId: block.id
      } as ContentBlockAdvanced
    }
    case "child_database": {
      const title = (field?.title as string | undefined) || undefined
      return {
        id: block.id,
        type,
        title,
        databaseId: block.id
      } as ContentBlockAdvanced
    }
    case "breadcrumb":
    case "table_of_contents":
    case "template": {
      return {
        id: block.id,
        type,
        children: childAdvanced.length ? childAdvanced : undefined
      } as ContentBlockAdvanced
    }
    default:
      return null
  }
}

async function mapBlocks(
  blocks: ContentBlockRaw[],
  options: RawAdvancedOptions
): Promise<ContentBlockAdvanced[]> {
  const out: ContentBlockAdvanced[] = []
  for (const b of blocks) {
    const mapped = await mapBlock(b, options)
    if (mapped) out.push(mapped)
  }
  return out
}

export async function blocksToAdvanced(
  rawBlocks: ContentBlockRaw[] = [],
  opts: RawAdvancedOptions = {}
): Promise<ContentBlockAdvanced[]> {
  const options: RawAdvancedOptions = {
    mediaUrlResolver: opts.mediaUrlResolver
  }
  return mapBlocks(rawBlocks, options)
}
