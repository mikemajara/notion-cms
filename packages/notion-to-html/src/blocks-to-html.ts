import {
  escapeAttribute,
  escapeHtml,
  richTextToHtml,
  richTextToPlain
} from "./rich-text"
import type { NotionBlock } from "./types"

export interface RawHtmlOptions {
  debug?: boolean
  listClassName?: string
  todoClassName?: string
  columnClassName?: string
}

interface ResolvedHtmlOptions {
  debug: boolean
  listClassName?: string
  todoClassName?: string
  columnClassName?: string
}

const CLASS_COLUMNS = "notion-columns"
const CLASS_COLUMN = "notion-column"
const CLASS_BULLETED = "notion-bulleted-list"
const CLASS_NUMBERED = "notion-numbered-list"
const CLASS_TODO = "notion-todo-list"
const CLASS_DEBUG = "notion-debug-placeholder"
const CLASS_MEDIA = "notion-media"

function resolveOptions(opts?: RawHtmlOptions): ResolvedHtmlOptions {
  return {
    debug: opts?.debug ?? false,
    listClassName: opts?.listClassName,
    todoClassName: opts?.todoClassName,
    columnClassName: opts?.columnClassName
  }
}

function classAttribute(...names: (string | undefined)[]): string {
  const classes = names.filter(Boolean).join(" ")
  return classes ? ` class="${classes}"` : ""
}

function getBlockType(block: NotionBlock): string {
  return (block as any).type as string
}

function getBlockField<T>(block: NotionBlock): T | undefined {
  const type = getBlockType(block)
  return (block as any)[type] as T
}

function buildStructuralPlaceholder(
  kind: string,
  block: NotionBlock,
  title: string | undefined,
  _options: ResolvedHtmlOptions
): string {
  const id = (block as any).id
  const safeKind = escapeAttribute(kind)
  const safeId = escapeAttribute(String(id))
  const safeTitle = title ? escapeHtml(title) : ""
  return `<div${classAttribute(CLASS_DEBUG)} data-kind="${safeKind}" data-block-id="${safeId}">${safeTitle}</div>`
}

function renderChildren(
  block: NotionBlock,
  depth: number,
  options: ResolvedHtmlOptions
): string {
  const children = (block as any).children as NotionBlock[] | undefined
  if (!children || !children.length) return ""
  return renderBlocks(children, depth + 1, options)
}

function renderListItems(
  items: NotionBlock[],
  listType: "bulleted_list_item" | "numbered_list_item",
  depth: number,
  options: ResolvedHtmlOptions
): string {
  const tag = listType === "bulleted_list_item" ? "ul" : "ol"
  const baseClass =
    listType === "bulleted_list_item" ? CLASS_BULLETED : CLASS_NUMBERED
  const attrs = classAttribute(baseClass, options.listClassName)
  const entries = items
    .map((item) => {
      const field = getBlockField<any>(item)
      const text = richTextToHtml(field?.rich_text ?? [])
      const children = renderChildren(item, depth + 1, options)
      return `<li>${text}${children}</li>`
    })
    .join("")
  return `<${tag}${attrs}>${entries}</${tag}>`
}

function renderTodoItems(
  items: NotionBlock[],
  depth: number,
  options: ResolvedHtmlOptions
): string {
  const attrs = classAttribute(CLASS_TODO, options.todoClassName)
  const entries = items
    .map((item) => {
      const field = getBlockField<any>(item)
      const text = richTextToHtml(field?.rich_text ?? [])
      const checked = Boolean(field?.checked)
      const children = renderChildren(item, depth + 1, options)
      const checkbox = `<input type="checkbox"${checked ? " checked" : ""} disabled />`
      return `<li>${checkbox}<span>${text}</span>${children}</li>`
    })
    .join("")
  return `<ul${attrs}>${entries}</ul>`
}

function renderTable(
  block: NotionBlock,
  options: ResolvedHtmlOptions
): string {
  const table = getBlockField<any>(block)
  const rows = ((block as any).children as NotionBlock[] | undefined) || []
  const cellRows = rows.map((row) => {
    const field = getBlockField<any>(row)
    const cells = (field?.cells as any[] | undefined) || []
    return cells.map((cell) => richTextToHtml(Array.isArray(cell) ? cell : []))
  })

  if (cellRows.length === 0) return ""

  const hasColumnHeader = Boolean(table?.has_column_header)
  const hasRowHeader = Boolean(table?.has_row_header)

  let thead = ""
  let tbodyRows = cellRows

  if (hasColumnHeader && cellRows.length > 0) {
    const headerCells = cellRows[0]
      .map((cell) => `<th>${cell}</th>`)
      .join("")
    thead = `<thead><tr>${headerCells}</tr></thead>`
    tbodyRows = cellRows.slice(1)
  }

  const body = tbodyRows
    .map((row) => {
      const cells = row
        .map((cell, index) => {
          if (hasRowHeader && index === 0) {
            return `<th scope="row">${cell}</th>`
          }
          return `<td>${cell}</td>`
        })
        .join("")
      return `<tr>${cells}</tr>`
    })
    .join("")

  const tbody = `<tbody>${body}</tbody>`
  return `<table>${thead}${tbody}</table>`
}

function renderMediaFigure(
  kind: "bookmark" | "embed" | "link_preview" | "image" | "video" | "audio" | "file" | "pdf",
  url: string | undefined,
  captionHtml: string,
  captionPlain: string
): string {
  if (!url) return ""
  const safeUrl = escapeAttribute(url)
  const figureClass = classAttribute(CLASS_MEDIA, `notion-${kind}`)
  const figcaption = captionHtml ? `<figcaption>${captionHtml}</figcaption>` : ""

  switch (kind) {
    case "bookmark":
    case "embed":
    case "link_preview": {
      const label = captionHtml || escapeHtml(url)
      return `<figure${figureClass}><a href="${safeUrl}">${label}</a>${figcaption}</figure>`
    }
    case "image": {
      const alt = captionPlain ? escapeAttribute(captionPlain) : "Notion image"
      return `<figure${figureClass}><img src="${safeUrl}" alt="${alt}" loading="lazy" />${figcaption}</figure>`
    }
    case "video": {
      return `<figure${figureClass}><video src="${safeUrl}" controls playsinline></video>${figcaption}</figure>`
    }
    case "audio": {
      return `<figure${figureClass}><audio src="${safeUrl}" controls></audio>${figcaption}</figure>`
    }
    case "file": {
      const label = captionHtml || escapeHtml(captionPlain || "Download file")
      return `<figure${figureClass}><a href="${safeUrl}">${label}</a>${figcaption}</figure>`
    }
    case "pdf": {
      return `<figure${figureClass}><object data="${safeUrl}" type="application/pdf"></object>${figcaption}</figure>`
    }
    default:
      return ""
  }
}

function renderBlock(
  block: NotionBlock,
  depth: number,
  options: ResolvedHtmlOptions
): string {
  const type = getBlockType(block)
  const field = getBlockField<any>(block)

  switch (type) {
    case "paragraph": {
      const text = richTextToHtml(field?.rich_text ?? [])
      const children = renderChildren(block, depth, options)
      const paragraph = `<p>${text}</p>`
      return `${paragraph}${children}`
    }
    case "toggle": {
      const summary = richTextToHtml(field?.rich_text ?? [])
      const children = renderChildren(block, depth, options)
      const body = children ? `<div>${children}</div>` : ""
      return `<details>${summary ? `<summary>${summary}</summary>` : ""}${body}</details>`
    }
    case "quote": {
      const text = richTextToHtml(field?.rich_text ?? [])
      const children = renderChildren(block, depth + 1, options)
      return `<blockquote>${text}${children}</blockquote>`
    }
    case "heading_1": {
      const text = richTextToHtml(field?.rich_text ?? [])
      return `<h1>${text}</h1>`
    }
    case "heading_2": {
      const text = richTextToHtml(field?.rich_text ?? [])
      return `<h2>${text}</h2>`
    }
    case "heading_3": {
      const text = richTextToHtml(field?.rich_text ?? [])
      return `<h3>${text}</h3>`
    }
    case "code": {
      const language = field?.language || ""
      const plain = escapeHtml(richTextToPlain(field?.rich_text ?? []))
      const langAttr = language ? ` data-language="${escapeAttribute(language)}"` : ""
      return `<pre><code${langAttr}>${plain}</code></pre>`
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const url = field?.url || ""
      const caption = richTextToHtml(field?.caption ?? [])
      const captionPlain = richTextToPlain(field?.caption ?? [])
      return (
        renderMediaFigure(type, url, caption, captionPlain) +
        renderChildren(block, depth, options)
      )
    }
    case "image":
    case "video":
    case "audio":
    case "file":
    case "pdf": {
      const src =
        field?.type === "external" ? field?.external?.url : field?.file?.url
      const caption = richTextToHtml(field?.caption ?? [])
      const captionPlain = richTextToPlain(field?.caption ?? [])
      return renderMediaFigure(type, src, caption, captionPlain)
    }
    case "equation": {
      const expression = field?.expression || ""
      const safeExpression = escapeHtml(expression)
      const attr = escapeAttribute(expression)
      return `<span data-notion-equation="${attr}">${safeExpression}</span>`
    }
    case "divider": {
      return "<hr />"
    }
    case "table": {
      return renderTable(block, options)
    }
    case "table_row": {
      return ""
    }
    case "column_list":
    case "columns": {
      const children = renderChildren(block, depth, options)
      return `<div${classAttribute(CLASS_COLUMNS, options.columnClassName)}>${children}</div>`
    }
    case "column": {
      const children = renderChildren(block, depth, options)
      return `<div${classAttribute(CLASS_COLUMN, options.columnClassName)}>${children}</div>`
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
    case "to_do": {
      return "" // handled by grouped renderer
    }
    case "bulleted_list_item":
    case "numbered_list_item": {
      return "" // handled by grouped renderer
    }
    default:
      return ""
  }
}

function renderBlocks(
  blocks: NotionBlock[] = [],
  depth = 0,
  options: ResolvedHtmlOptions
): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return ""

  const parts: string[] = []
  let index = 0

  while (index < blocks.length) {
    const block = blocks[index]
    const type = getBlockType(block)

    if (type === "bulleted_list_item" || type === "numbered_list_item") {
      const listType = type
      const items: NotionBlock[] = []
      while (
        index < blocks.length &&
        getBlockType(blocks[index]) === listType
      ) {
        items.push(blocks[index])
        index++
      }
      parts.push(renderListItems(items, listType, depth, options))
      continue
    }

    if (type === "to_do") {
      const items: NotionBlock[] = []
      while (index < blocks.length && getBlockType(blocks[index]) === "to_do") {
        items.push(blocks[index])
        index++
      }
      parts.push(renderTodoItems(items, depth, options))
      continue
    }

    parts.push(renderBlock(block, depth, options))
    index++
  }

  return parts.join("")
}

export function blocksToHtml(
  rawBlocks: NotionBlock[] = [],
  opts?: RawHtmlOptions
): string {
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return ""
  const options = resolveOptions(opts)
  return renderBlocks(rawBlocks, 0, options)
}

