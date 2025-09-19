import type { ContentBlockRaw } from "../../content-types"
import { groupConsecutiveListItems } from "../../utils/block-traversal"
import { richTextToMarkdown, richTextToPlain } from "../../utils/rich-text"

export interface RawMarkdownOptions {
  listIndent?: string
}

function getBlockType(block: ContentBlockRaw): string {
  return (block as any).type as string
}

function getBlockField<T = any>(block: ContentBlockRaw): T | undefined {
  const type = getBlockType(block)
  return (block as any)[type] as T
}

function indent(depth: number, unit: string): string {
  return unit.repeat(Math.max(0, depth))
}

function renderChildren(
  block: ContentBlockRaw,
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const children = (block as any).children as ContentBlockRaw[] | undefined
  if (!children || !children.length) return ""
  return renderBlocks(children, depth, options)
}

function renderListGroup(
  items: ContentBlockRaw[],
  listType: "bulleted_list_item" | "numbered_list_item",
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const pad = indent(depth, options.listIndent)
  let out = ""
  if (listType === "bulleted_list_item") {
    for (const item of items) {
      const field = getBlockField<any>(item)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      out += `${pad}- ${text}\n`
      out += renderChildren(item, depth + 1, options)
    }
  } else {
    let index = 1
    for (const item of items) {
      const field = getBlockField<any>(item)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      out += `${pad}${index}. ${text}\n`
      out += renderChildren(item, depth + 1, options)
      index++
    }
  }
  return out
}

function renderTable(
  block: ContentBlockRaw,
  _options: Required<RawMarkdownOptions>
): string {
  const table = getBlockField<any>(block)
  const rows = ((block as any).children as ContentBlockRaw[] | undefined) || []
  const rowCells: string[][] = rows.map((r) => {
    const field = getBlockField<any>(r)
    const cells = (field?.cells as any[] | undefined) || []
    return cells.map((cell) =>
      richTextToMarkdown((cell?.[0]?.rich_text as any[]) || [])
    )
  })
  const hasHeader = Boolean(table?.has_column_header)
  let out = ""
  if (rowCells.length === 0) return out
  const colCount = rowCells[0].length
  if (hasHeader) {
    out += `| ${rowCells[0].join(" | ")} |\n`
    out += `| ${Array.from({ length: colCount })
      .map(() => "---")
      .join(" | ")} |\n`
    for (let i = 1; i < rowCells.length; i++) {
      out += `| ${rowCells[i].join(" | ")} |\n`
    }
  } else {
    out += `| ${Array.from({ length: colCount })
      .map(() => " ")
      .join(" | ")} |\n`
    out += `| ${Array.from({ length: colCount })
      .map(() => "---")
      .join(" | ")} |\n`
    for (let i = 0; i < rowCells.length; i++) {
      out += `| ${rowCells[i].join(" | ")} |\n`
    }
  }
  return out
}

function renderBlock(
  block: ContentBlockRaw,
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const type = getBlockType(block)
  const field = getBlockField<any>(block)
  if (field === undefined) {
    throw new Error(
      `blocksToMarkdown expects Raw Notion blocks; missing field for type "${type}"`
    )
  }
  const pad = indent(depth, options.listIndent)

  switch (type) {
    case "paragraph": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return text ? `${text}\n` : "\n"
    }
    case "quote": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return text ? `> ${text}\n` : `>\n`
    }
    case "toggle": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `${text}\n${renderChildren(block, depth + 1, options)}`
    }
    case "to_do": {
      const checked = Boolean(field?.checked)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `${pad}- [${checked ? "x" : " "}] ${text}\n${renderChildren(
        block,
        depth + 1,
        options
      )}`
    }
    case "heading_1": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `# ${text}\n`
    }
    case "heading_2": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `## ${text}\n`
    }
    case "heading_3": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `### ${text}\n`
    }
    case "code": {
      const language = field?.language || ""
      const content = richTextToPlain(field?.rich_text ?? [])
      return `\n\n\`\`\`${language}\n${content}\n\`\`\`\n\n`
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const url = field?.url || ""
      const caption = richTextToMarkdown(field?.caption ?? [])
      let out = `${url}\n`
      if (caption) out += `${caption}\n`
      return out
    }
    case "image":
    case "video":
    case "audio":
    case "file":
    case "pdf": {
      const src =
        field?.type === "external" ? field?.external?.url : field?.file?.url
      const caption = richTextToMarkdown(field?.caption ?? [])
      let out = `${src || ""}\n`
      if (caption) out += `${caption}\n`
      return out
    }
    case "equation": {
      const expr = field?.expression || ""
      return `$$${expr}$$\n`
    }
    case "divider": {
      return `---\n`
    }
    case "table": {
      return renderTable(block, options)
    }
    case "table_row": {
      return ""
    }
    case "columns": {
      const _columns = ((field?.children as any[]) || []) as any[]
      let out = ""
      const children = (block as any).children as ContentBlockRaw[] | undefined
      if (children && children.length) {
        out += renderBlocks(children, depth, options)
      }
      return out
    }
    case "column": {
      return renderChildren(block, depth, options)
    }
    case "synced_block": {
      return renderChildren(block, depth, options)
    }
    case "child_page": {
      const title = (field?.title as string | undefined) || ""
      return `[child_page] ${title}\n`
    }
    case "child_database": {
      const title = (field?.title as string | undefined) || ""
      return `[child_database] ${title}\n`
    }
    case "breadcrumb": {
      return "[breadcrumb]\n"
    }
    case "table_of_contents": {
      return "[table_of_contents]\n"
    }
    case "template": {
      return renderChildren(block, depth, options)
    }
    default: {
      return ""
    }
  }
}

function renderBlocks(
  blocks: ContentBlockRaw[],
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  let out = ""
  const grouped = groupConsecutiveListItems(blocks)
  for (const node of grouped) {
    if ((node as any).kind === "list_group") {
      const group = node as any
      out += renderListGroup(group.items, group.listType, depth, options)
      continue
    }
    out += renderBlock(node as ContentBlockRaw, depth, options)
  }
  return out
}

export function blocksToMarkdown(
  rawBlocks: ContentBlockRaw[] = [],
  opts: RawMarkdownOptions = {}
): string {
  const options: Required<RawMarkdownOptions> = {
    listIndent: opts.listIndent ?? "  "
  }
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return ""
  return renderBlocks(rawBlocks, 0, options).trim() + "\n"
}
