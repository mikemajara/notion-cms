import { richTextToMarkdown, richTextToPlain } from "./rich-text"
import type { NotionBlock } from "./types"

export interface RawMarkdownOptions {
  listIndent?: string
  debug?: boolean
}

function getBlockType(block: NotionBlock): string {
  return (block as any).type as string
}

function getBlockField<T = any>(block: NotionBlock): T | undefined {
  const type = getBlockType(block)
  return (block as any)[type] as T
}

function indent(depth: number, unit: string): string {
  return unit.repeat(Math.max(0, depth * 2))
}

function buildStructuralPlaceholder(
  kind: string,
  block: NotionBlock,
  title: string | undefined,
  _options: Required<RawMarkdownOptions>
): string {
  const id = (block as any).id
  let out = `[${kind}]${title ? ` ${title}` : ""}`
  out += ` [id: ${id}]`
  return `${out}`
}

function renderChildren(
  block: NotionBlock,
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const children = (block as any).children as NotionBlock[] | undefined
  if (!children || !children.length) return ""
  return renderBlocks(children, depth, options)
}

function renderListGroup(
  items: NotionBlock[],
  listType: "bulleted_list_item" | "numbered_list_item",
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const pad = indent(depth, options.listIndent)
  const lines: string[] = []
  if (listType === "bulleted_list_item") {
    for (const item of items) {
      const field = getBlockField<any>(item)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      const children = renderChildren(item, depth + 1, options)
      if (children) {
        const trimmedChildren = children.replace(/\n+$/, "")
        lines.push(`${pad}- ${text}\n${trimmedChildren}`)
      } else {
        lines.push(`${pad}- ${text}`)
      }
    }
  } else {
    let index = 1
    for (const item of items) {
      const field = getBlockField<any>(item)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      const marker = String(index)
      const children = renderChildren(item, depth + 1, options)
      if (children) {
        const trimmedChildren = children.replace(/\n+$/, "")
        lines.push(`${pad}${marker}. ${text}\n${trimmedChildren}`)
      } else {
        lines.push(`${pad}${marker}. ${text}`)
      }
      index++
    }
  }
  return lines.join("\n")
}

function renderTable(
  block: NotionBlock,
  _options: Required<RawMarkdownOptions>
): string {
  const table = getBlockField<any>(block)
  const rows = ((block as any).children as NotionBlock[] | undefined) || []
  const rowCells: string[][] = rows.map((r) => {
    const field = getBlockField<any>(r)
    const cells = (field?.cells as any[] | undefined) || []
    return cells.map((cell) => {
      const rich = Array.isArray(cell) ? (cell as any[]) : []
      return richTextToMarkdown(rich)
    })
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
  block: NotionBlock,
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
      return text ? `${text}` : " "
    }
    case "quote": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return text ? `> ${text}` : `>`
    }
    case "toggle": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      const children = renderChildren(block, depth + 1, options)
      if (text && children) {
        return `${text}\n${children}`
      }
      if (text) return text
      return children
    }
    case "to_do": {
      const checked = Boolean(field?.checked)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      const children = renderChildren(block, depth + 1, options)
      return children
        ? `${pad}- [${checked ? "x" : " "}] ${text}\n${children}`
        : `${pad}- [${checked ? "x" : " "}] ${text}`
    }
    case "heading_1": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `# ${text}`
    }
    case "heading_2": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `## ${text}`
    }
    case "heading_3": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `### ${text}`
    }
    case "code": {
      const language = field?.language || ""
      const content = richTextToPlain(field?.rich_text ?? [])
      return `\`\`\`\n${language}\n${content}\n\`\`\``
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const url = field?.url || ""
      const caption = richTextToMarkdown(field?.caption ?? [])
      let out = `${url}`
      if (caption) out += `${caption}`
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
      return `![${caption ?? ""}](${src ?? ""})`
    }
    case "equation": {
      return field?.expression || ""
    }
    case "divider": {
      return `---`
    }
    case "table": {
      return renderTable(block, options)
    }
    case "table_row": {
      return ""
    }
    case "column_list": {
      const _columns = ((field?.children as any[]) || []) as any[]
      let out = ""
      const children = (block as any).children as NotionBlock[] | undefined
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
      if (!options.debug) return ""
      const title = (field?.title as string | undefined) || ""
      return buildStructuralPlaceholder("child_page", block, title, options)
    }
    case "child_database": {
      if (!options.debug) return ""
      const title = (field?.title as string | undefined) || ""
      return buildStructuralPlaceholder("child_database", block, title, options)
    }
    case "breadcrumb": {
      if (!options.debug) return ""
      return buildStructuralPlaceholder("breadcrumb", block, undefined, options)
    }
    case "table_of_contents": {
      if (!options.debug) return ""
      return buildStructuralPlaceholder(
        "table_of_contents",
        block,
        undefined,
        options
      )
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
  blocks: NotionBlock[],
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const segments: string[] = []
  let pendingListType: "bulleted_list_item" | "numbered_list_item" | null = null
  let pendingItems: NotionBlock[] = []

  const flushList = () => {
    if (!pendingListType || pendingItems.length === 0) return
    const content = renderListGroup(
      pendingItems,
      pendingListType,
      depth,
      options
    )
    if (content) {
      segments.push(content)
    }
    pendingListType = null
    pendingItems = []
  }

  for (const block of blocks) {
    const type = getBlockType(block)
    if (type === "bulleted_list_item" || type === "numbered_list_item") {
      if (pendingListType !== type) {
        flushList()
        pendingListType = type
      }
      pendingItems.push(block)
      continue
    }

    flushList()
    const rendered = renderBlock(block, depth, options)
    if (rendered) {
      segments.push(rendered)
    }
  }

  flushList()
  if (segments.length === 0) return ""
  return `${segments.join("\n\n")}`.replace(/\n*$/, "") + "\n"
}

export function blocksToMarkdown(
  rawBlocks: NotionBlock[] = [],
  opts?: RawMarkdownOptions
): string {
  opts = opts ?? {}
  const options: Required<RawMarkdownOptions> = {
    listIndent: opts.listIndent ?? "  ",
    debug: opts.debug ?? false
  }
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return ""
  console.log("rawBlocks", JSON.stringify(rawBlocks))
  return renderBlocks(rawBlocks, 0, options)
}
