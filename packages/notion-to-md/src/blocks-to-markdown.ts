import type { ContentBlockRaw } from "@notion-utils/types"
import { richTextToMarkdown, richTextToPlain } from "./rich-text"

export interface RawMarkdownOptions {
  listIndent?: string
  debug?: boolean
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

function indentLines(text: string, indent: string): string {
  if (!text || !indent) return text
  return text.replace(/^/gm, indent)
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
  return `${out}`
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
  if (rowCells.length === 0) return ""

  const lines: string[] = []
  const colCount = rowCells[0].length
  const divider = `| ${Array.from({ length: colCount })
    .map(() => "---")
    .join(" | ")} |`

  if (table?.has_column_header) {
    lines.push(`| ${rowCells[0].join(" | ")} |`)
    lines.push(divider)
    for (let i = 1; i < rowCells.length; i++) {
      lines.push(`| ${rowCells[i].join(" | ")} |`)
    }
  } else {
    const emptyHeader = `| ${Array.from({ length: colCount })
      .map(() => " ")
      .join(" | ")} |`
    lines.push(emptyHeader)
    lines.push(divider)
    for (let i = 0; i < rowCells.length; i++) {
      lines.push(`| ${rowCells[i].join(" | ")} |`)
    }
  }

  return lines.join("\n")
}

function renderBlock(
  block: ContentBlockRaw,
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const type = getBlockType(block)
  const field = getBlockField<any>(block)

  const appendWithChildren = (
    body: string | null | undefined,
    children: string,
    indent: string = ""
  ): string => {
    let result = ""
    if (body !== null && body !== undefined) {
      result += `${body}\n`
    }
    if (children) {
      result += indentLines(children, indent)
    }
    return result
  }

  switch (type) {
    case "paragraph":
    case "toggle": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return (
        appendWithChildren(
          text ?? "",
          renderChildren(block, depth, options),
          indent(depth + 1, options.listIndent)
        ) + "\n"
      )
    }
    case "quote": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      const body = text ? `> ${text}` : ">"
      return (
        appendWithChildren(
          body,
          renderChildren(block, depth + 1, options),
          indent(depth + 1, options.listIndent)
        ) + "\n"
      )
    }
    case "heading_1": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return appendWithChildren(
        `# ${text}\n`,
        renderChildren(block, depth, options)
      )
    }
    case "heading_2": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return appendWithChildren(
        `## ${text}\n`,
        renderChildren(block, depth, options)
      )
    }
    case "heading_3": {
      const text = richTextToMarkdown(field?.rich_text ?? [])
      return appendWithChildren(
        `### ${text}\n`,
        renderChildren(block, depth, options)
      )
    }
    case "code": {
      const language = field?.language || ""
      const content = richTextToPlain(field?.rich_text ?? [])
      const body = `\n\`\`\`${language}\n${content}\n\`\`\``
      return appendWithChildren(body, "") + "\n"
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const url = field?.url || ""
      const caption = richTextToMarkdown(field?.caption ?? [])
      const body = caption ? `${url}${caption}` : url
      return (
        appendWithChildren(body, renderChildren(block, depth, options)) + "\n"
      )
    }
    case "image":
    case "video":
    case "audio":
    case "file":
    case "pdf": {
      const src =
        field?.type === "external" ? field?.external?.url : field?.file?.url
      const caption = richTextToMarkdown(field?.caption ?? []) || ""
      const body = `![${caption}](${src ?? ""})`
      return appendWithChildren(body, "")
    }
    case "equation": {
      return (
        "$$\n" + appendWithChildren(field?.expression || "", "") + "$$" + "\n"
      )
    }
    case "divider": {
      return appendWithChildren("---", "")
    }
    case "table": {
      return appendWithChildren(renderTable(block, options), "") + "\n"
    }
    case "table_row": {
      return ""
    }
    case "column_list":
    case "columns": {
      return renderChildren(block, depth, options)
    }
    case "column": {
      return renderChildren(block, depth, options) + "\n"
    }
    case "synced_block": {
      return renderChildren(block, depth, options)
    }
    case "child_page": {
      if (!options.debug) return ""
      const title = (field?.title as string | undefined) || ""
      return appendWithChildren(
        buildStructuralPlaceholder("child_page", block, title, options),
        ""
      )
    }
    case "child_database": {
      if (!options.debug) return ""
      const title = (field?.title as string | undefined) || ""
      return appendWithChildren(
        buildStructuralPlaceholder("child_database", block, title, options),
        ""
      )
    }
    case "breadcrumb": {
      if (!options.debug) return ""
      return appendWithChildren(
        buildStructuralPlaceholder("breadcrumb", block, undefined, options),
        ""
      )
    }
    case "table_of_contents": {
      if (!options.debug) return ""
      return appendWithChildren(
        buildStructuralPlaceholder(
          "table_of_contents",
          block,
          undefined,
          options
        ),
        ""
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

function renderListItems(
  items: ContentBlockRaw[],
  listType: "bulleted_list_item" | "numbered_list_item",
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const pad = indent(depth, options.listIndent)
  let output = ""
  let index = 1

  for (const item of items) {
    const field = getBlockField<any>(item)
    const text = richTextToMarkdown(field?.rich_text ?? [])
    const marker = listType === "bulleted_list_item" ? "- " : `${index}. `
    output += `${pad}${marker}${text}\n`
    const children = renderChildren(item, depth + 1, options)
    if (children) {
      output += children
    }
    if (listType === "numbered_list_item") {
      index++
    }
  }

  return output
}

function renderTodoItems(
  items: ContentBlockRaw[],
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  const pad = indent(depth, options.listIndent)
  let output = ""

  for (const item of items) {
    const field = getBlockField<any>(item)
    const text = richTextToMarkdown(field?.rich_text ?? [])
    const checked = Boolean(field?.checked)
    output += `${pad}- [${checked ? "x" : " "}] ${text}\n`
    const children = renderChildren(item, depth + 1, options)
    if (children) {
      output += children
    }
  }

  return output + "\n"
}

function renderBlocks(
  blocks: ContentBlockRaw[] = [],
  depth: number,
  options: Required<RawMarkdownOptions>
): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return ""

  let output = ""
  let index = 0

  while (index < blocks.length) {
    const block = blocks[index]
    const type = getBlockType(block)

    if (type === "bulleted_list_item" || type === "numbered_list_item") {
      const listType = type
      const items: ContentBlockRaw[] = []
      while (
        index < blocks.length &&
        getBlockType(blocks[index]) === listType
      ) {
        items.push(blocks[index])
        index++
      }
      output += renderListItems(items, listType, depth, options)
      continue
    }

    if (type === "to_do") {
      const items: ContentBlockRaw[] = []
      while (index < blocks.length && getBlockType(blocks[index]) === "to_do") {
        items.push(blocks[index])
        index++
      }
      output += renderTodoItems(items, depth, options)
      continue
    }

    output += renderBlock(block, depth, options)
    index++
  }

  return output
}

export function blocksToMarkdown(
  rawBlocks: ContentBlockRaw[] = [],
  opts?: RawMarkdownOptions
): string {
  opts = opts ?? {}
  const options: Required<RawMarkdownOptions> = {
    listIndent: opts.listIndent ?? "  ",
    debug: opts.debug ?? false
  }
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return ""

  return renderBlocks(rawBlocks, 0, options)
}
