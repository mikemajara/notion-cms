import type { ContentBlockRaw } from "../../types/content-types"
import { groupConsecutiveListItems } from "../../utils/block-traversal"
import { richTextToMarkdown, richTextToPlain } from "../../utils/rich-text"

export interface RawMarkdownOptions {
  listIndent?: string
  debug?: boolean
  alternateOrderedListStyles?: boolean
}

function getBlockType(block: ContentBlockRaw): string {
  return (block as any).type as string
}

function getBlockField<T = any>(block: ContentBlockRaw): T | undefined {
  const type = getBlockType(block)
  return (block as any)[type] as T
}

function indent(depth: number, unit: string): string {
  return unit.repeat(Math.max(0, depth * 2))
}

function toAlphabetic(index: number): string {
  let n = Math.max(1, Math.floor(index))
  let out = ""
  while (n > 0) {
    n--
    out = String.fromCharCode(97 + (n % 26)) + out
    n = Math.floor(n / 26)
  }
  return out
}

function toRoman(index: number): string {
  let n = Math.max(1, Math.floor(index))
  const numerals: Array<[number, string]> = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"]
  ]
  let out = ""
  for (const [value, symbol] of numerals) {
    while (n >= value) {
      out += symbol
      n -= value
    }
  }
  return out
}

function orderedMarker(index: number, orderedLevel: number): string {
  const level = Math.max(1, orderedLevel)
  const mode = (level - 1) % 3
  if (mode === 0) return String(index)
  if (mode === 1) return toAlphabetic(index)
  return toRoman(index)
}

function buildStructuralPlaceholder(
  kind: string,
  block: ContentBlockRaw,
  title: string | undefined,
  _options: Required<RawMarkdownOptions>
): string {
  const id = (block as any).id
  let out = `[${kind}]${title ? ` ${title}` : ""}`
  out += ` [id: ${id}]`
  return `${out}\n`
}

function renderChildren(
  block: ContentBlockRaw,
  depth: number,
  options: Required<RawMarkdownOptions>,
  orderedChainDepth: number
): string {
  const children = (block as any).children as ContentBlockRaw[] | undefined
  if (!children || !children.length) return ""
  return renderBlocks(children, depth, options, orderedChainDepth)
}

function renderListGroup(
  items: ContentBlockRaw[],
  listType: "bulleted_list_item" | "numbered_list_item",
  depth: number,
  options: Required<RawMarkdownOptions>,
  orderedLevel: number
): string {
  const pad = indent(depth, options.listIndent)
  let out = ""
  if (listType === "bulleted_list_item") {
    for (const item of items) {
      const field = getBlockField<any>(item)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      out += `${pad}- ${text}\n`
      out += renderChildren(item, depth + 1, options, 0)
    }
  } else {
    let index = 1
    for (const item of items) {
      const field = getBlockField<any>(item)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      const marker = options.alternateOrderedListStyles
        ? orderedMarker(index, orderedLevel)
        : String(index)
      out += `${pad}${marker}. ${text}\n`
      out += renderChildren(item, depth + 1, options, orderedLevel)
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
      return text ? `${text}` : ""
    }
    case "quote": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return text ? `> ${text}` : `>`
    }
    case "toggle": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `${text}${renderChildren(block, depth + 1, options, 0)}`
    }
    case "to_do": {
      const checked = Boolean(field?.checked)
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return `${pad}- [${checked ? "x" : " "}] ${text}${renderChildren(
        block,
        depth + 1,
        options,
        0
      )}`
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
      // TODO: include caption if available and output in format
      // [image-src]([caption])
      const src =
        field?.type === "external" ? field?.external?.url : field?.file?.url
      const caption = richTextToMarkdown(field?.caption ?? [])
      return `![${caption ?? ""}](${src ?? ""})`
    }
    case "equation": {
      const expr = field?.expression || ""
      return `$$${expr}$$`
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
    case "columns": {
      const _columns = ((field?.children as any[]) || []) as any[]
      let out = ""
      const children = (block as any).children as ContentBlockRaw[] | undefined
      if (children && children.length) {
        out += renderBlocks(children, depth, options, 0)
      }
      return out
    }
    case "column": {
      return renderChildren(block, depth, options, 0)
    }
    case "synced_block": {
      return renderChildren(block, depth, options, 0)
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
      return renderChildren(block, depth, options, 0)
    }
    default: {
      return ""
    }
  }
}

function renderBlocks(
  blocks: ContentBlockRaw[],
  depth: number,
  options: Required<RawMarkdownOptions>,
  orderedChainDepth: number
): string {
  let out = ""
  const grouped = groupConsecutiveListItems(blocks)
  for (const node of grouped) {
    if ((node as any).kind === "list_group") {
      const group = node as any
      const currentOrderedLevel =
        group.listType === "numbered_list_item" ? orderedChainDepth + 1 : 0
      out += renderListGroup(
        group.items,
        group.listType,
        depth,
        options,
        currentOrderedLevel
      )
      continue
    }
    out += renderBlock(node as ContentBlockRaw, depth, options) + "\n\n"
  }
  return out
}

export function blocksToMarkdown(
  rawBlocks: ContentBlockRaw[] = [],
  opts?: RawMarkdownOptions
): string {
  opts = opts ?? {}
  const options: Required<RawMarkdownOptions> = {
    listIndent: opts.listIndent ?? "  ",
    debug: opts.debug ?? false,
    alternateOrderedListStyles: opts.alternateOrderedListStyles ?? false
  }
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return ""
  return renderBlocks(rawBlocks, 0, options, 0)
}
