import type {
  ContentBlockRaw,
  ContentBlockAdvanced
} from "../types/content-types"
import type { FileManager } from "../file-processor/file-manager"
import type { RawAdvancedOptions } from "./block-content-converter/converter-raw-advanced"
import { blocksToAdvanced } from "./block-content-converter/converter-raw-advanced"
import type { SimpleBlock } from "./content-converter"

type ConvertBlockOptions = {
  fileManager?: FileManager
}

type ConvertBlocksOptions = ConvertBlockOptions

export async function convertBlockToSimple(
  block: ContentBlockRaw,
  options: ConvertBlockOptions = {}
): Promise<SimpleBlock> {
  const content = extractBlockContent(block)
  const childrenRaw =
    ((block as any).children as ContentBlockRaw[] | undefined) || []
  const children = childrenRaw.length
    ? await convertBlocksToSimple(childrenRaw, options)
    : undefined

  return {
    id: block.id,
    type: (block as any).type,
    content,
    hasChildren: Boolean((block as any).has_children),
    ...(children && children.length ? { children } : {})
  }
}

export async function convertBlocksToSimple(
  blocks: ContentBlockRaw[] = [],
  options: ConvertBlocksOptions = {}
): Promise<SimpleBlock[]> {
  return Promise.all(
    blocks.map((block) => convertBlockToSimple(block, options))
  )
}

export interface ConvertBlocksToAdvancedOptions {
  mediaUrlResolver?: RawAdvancedOptions["mediaUrlResolver"]
  fileManager?: FileManager
}

export async function convertBlocksToAdvanced(
  blocks: ContentBlockRaw[] = [],
  options: ConvertBlocksToAdvancedOptions = {}
): Promise<ContentBlockAdvanced[]> {
  const mediaUrlResolver =
    options.mediaUrlResolver ||
    (async (_block, field) => {
      if (!field) return ""
      const defaultUrl =
        field?.type === "external" ? field?.external?.url : field?.file?.url

      if (!options.fileManager || !defaultUrl) {
        return defaultUrl || ""
      }

      try {
        return await options.fileManager.processFileUrl(
          defaultUrl,
          `content-block-${_block.id}`
        )
      } catch {
        return defaultUrl || ""
      }
    })

  return blocksToAdvanced(blocks, { mediaUrlResolver })
}

function extractBlockContent(block: ContentBlockRaw): any {
  const type = (block as any).type
  const field = (block as any)[type]

  switch (type) {
    case "paragraph":
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "bulleted_list_item":
    case "numbered_list_item":
    case "toggle":
    case "quote":
      return {
        text: extractRichText(field?.rich_text),
        richText: field?.rich_text
      }
    case "code":
      return {
        text: extractRichText(field?.rich_text),
        language: field?.language
      }
    case "image":
    case "file":
    case "pdf":
    case "video":
    case "audio": {
      const url = resolveMediaUrl(field)
      return {
        caption: field?.caption ? extractRichText(field.caption) : "",
        url
      }
    }
    case "bookmark":
    case "embed":
    case "link_preview":
      return {
        url: field?.url || "",
        caption: field?.caption ? extractRichText(field.caption) : ""
      }
    case "divider":
    case "equation":
    case "table_of_contents":
      return field || {}
    case "to_do":
      return {
        text: extractRichText(field?.rich_text),
        checked: Boolean(field?.checked)
      }
    case "callout":
      return {
        text: extractRichText(field?.rich_text),
        icon: field?.icon
      }
    case "table":
      return {
        tableWidth: field?.table_width,
        hasColumnHeader: field?.has_column_header,
        hasRowHeader: field?.has_row_header
      }
    case "table_row":
      return {
        cells: (field?.cells || []).map((cell: any[]) => ({
          plainText: extractRichText(cell),
          richText: cell
        }))
      }
    default:
      return field || {}
  }
}

function resolveMediaUrl(field: any): string {
  if (!field) return ""
  const url =
    field?.type === "external" ? field?.external?.url : field?.file?.url
  return url || ""
}

function extractRichText(richText: any[] = []): string {
  if (!Array.isArray(richText)) return ""
  return richText.map((text) => text?.plain_text || "").join("")
}
