import type { ContentBlockRaw } from "../../types/content-types"
import { groupConsecutiveListItems } from "../../utils/block-traversal"
import { richTextToHtml, richTextToPlain } from "../../utils/rich-text"
import { escapeHtml } from "../../utils/rich-text"

export interface RawHtmlOptions {
  classPrefix?: string
}

function getBlockType(block: ContentBlockRaw): string {
  return (block as any).type as string
}

function getBlockField<T = any>(block: ContentBlockRaw): T | undefined {
  const type = getBlockType(block)
  return (block as any)[type] as T
}

function renderChildren(
  block: ContentBlockRaw,
  depth: number,
  options: Required<RawHtmlOptions>
): string {
  const children = (block as any).children as ContentBlockRaw[] | undefined
  if (!children || !children.length) return ""
  return renderBlocks(children, depth + 1, options)
}

function renderListGroup(
  items: ContentBlockRaw[],
  listType: "bulleted_list_item" | "numbered_list_item",
  depth: number,
  options: Required<RawHtmlOptions>
): string {
  const tag = listType === "bulleted_list_item" ? "ul" : "ol"
  let out = `<${tag}>`
  for (const item of items) {
    const field = getBlockField<any>(item)
    const inner = richTextToHtml(field?.rich_text ?? [], options.classPrefix)
    out += `<li>${inner}${renderChildren(item, depth + 1, options)}</li>`
  }
  out += `</${tag}>`
  return out
}

function renderTable(
  block: ContentBlockRaw,
  options: Required<RawHtmlOptions>
): string {
  const table = getBlockField<any>(block)
  const rows = ((block as any).children as ContentBlockRaw[] | undefined) || []
  const hasHeader = Boolean(table?.has_column_header)
  let out = `<table>`
  if (rows.length) {
    if (hasHeader) {
      const headRow = rows[0]
      const headField = getBlockField<any>(headRow)
      const headCells = (headField?.cells as any[] | undefined) || []
      out += `<thead><tr>`
      out += headCells
        .map(
          (c) =>
            `<th>${richTextToHtml(
              (c?.[0]?.rich_text as any[]) || [],
              options.classPrefix
            )}</th>`
        )
        .join("")
      out += `</tr></thead>`
    }
    const start = hasHeader ? 1 : 0
    out += `<tbody>`
    for (let i = start; i < rows.length; i++) {
      const r = rows[i]
      const rField = getBlockField<any>(r)
      const rCells = (rField?.cells as any[] | undefined) || []
      out += `<tr>`
      out += rCells
        .map(
          (c) =>
            `<td>${richTextToHtml(
              (c?.[0]?.rich_text as any[]) || [],
              options.classPrefix
            )}</td>`
        )
        .join("")
      out += `</tr>`
    }
    out += `</tbody>`
  }
  out += `</table>`
  return out
}

function renderBlock(
  block: ContentBlockRaw,
  depth: number,
  options: Required<RawHtmlOptions>
): string {
  const type = getBlockType(block)
  const field = getBlockField<any>(block)

  switch (type) {
    case "paragraph": {
      const inner = richTextToHtml(field?.rich_text ?? [], options.classPrefix)
      return `<p>${inner}</p>`
    }
    case "quote": {
      const inner = richTextToHtml(field?.rich_text ?? [], options.classPrefix)
      return `<blockquote>${inner}</blockquote>`
    }
    case "toggle": {
      const summary = richTextToHtml(
        field?.rich_text ?? [],
        options.classPrefix
      )
      return `<details><summary>${summary}</summary>${renderChildren(
        block,
        depth + 1,
        options
      )}</details>`
    }
    case "to_do": {
      const checked = Boolean(field?.checked)
      const inner = richTextToHtml(field?.rich_text ?? [], options.classPrefix)
      return `<div class="notion-todo"><input type="checkbox" disabled ${
        checked ? "checked" : ""
      } /> ${inner}${renderChildren(block, depth + 1, options)}</div>`
    }
    case "heading_1": {
      const inner = richTextToHtml(field?.rich_text ?? [], options.classPrefix)
      return `<h1>${inner}</h1>`
    }
    case "heading_2": {
      const inner = richTextToHtml(field?.rich_text ?? [], options.classPrefix)
      return `<h2>${inner}</h2>`
    }
    case "heading_3": {
      const inner = richTextToHtml(field?.rich_text ?? [], options.classPrefix)
      return `<h3>${inner}</h3>`
    }
    case "code": {
      const language = field?.language || ""
      const content = richTextToPlain(field?.rich_text ?? [])
      const safeContent = escapeHtml(content)
      return `<pre><code class="language-${language}">${safeContent}</code></pre>`
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const url = field?.url || ""
      return `<a href="${url}">${url}</a>`
    }
    case "image": {
      const src =
        field?.type === "external" ? field?.external?.url : field?.file?.url
      const caption = richTextToHtml(field?.caption ?? [], options.classPrefix)
      return `<figure><img src="${src || ""}" />${
        caption ? `<figcaption>${caption}</figcaption>` : ""
      }</figure>`
    }
    case "video":
    case "audio": {
      const src =
        field?.type === "external" ? field?.external?.url : field?.file?.url
      const tag = type === "video" ? "video" : "audio"
      const caption = richTextToHtml(field?.caption ?? [], options.classPrefix)
      return `<figure><${tag} src="${src || ""}" controls></${tag}>${
        caption ? `<figcaption>${caption}</figcaption>` : ""
      }</figure>`
    }
    case "file":
    case "pdf": {
      const src =
        field?.type === "external" ? field?.external?.url : field?.file?.url
      const caption = richTextToHtml(field?.caption ?? [], options.classPrefix)
      return `<div class="notion-file"><a href="${src || ""}">${src || ""}</a>${
        caption ? `<div class="caption">${caption}</div>` : ""
      }</div>`
    }
    case "equation": {
      const expr = field?.expression || ""
      return `<span class="notion-equation">$$${expr}$$</span>`
    }
    case "divider": {
      return `<hr />`
    }
    case "table": {
      return renderTable(block, options)
    }
    case "table_row": {
      return ""
    }
    case "columns": {
      const children = (block as any).children as ContentBlockRaw[] | undefined
      let out = `<div class="notion-columns">`
      if (children && children.length) {
        out += children
          .map(
            (col) =>
              `<div class="notion-column">${renderChildren(
                col,
                depth + 1,
                options
              )}</div>`
          )
          .join("")
      }
      out += `</div>`
      return out
    }
    case "column":
    case "synced_block":
    case "template": {
      return renderChildren(block, depth, options)
    }
    case "child_page": {
      const title = (field?.title as string | undefined) || ""
      return `<div class="notion-child-page">${title}</div>`
    }
    case "child_database": {
      const title = (field?.title as string | undefined) || ""
      return `<div class="notion-child-database">${title}</div>`
    }
    case "breadcrumb": {
      return `<nav class="notion-breadcrumb"></nav>`
    }
    case "table_of_contents": {
      return `<nav class="notion-toc"></nav>`
    }
    default: {
      return ""
    }
  }
}

function renderBlocks(
  blocks: ContentBlockRaw[],
  depth: number,
  options: Required<RawHtmlOptions>
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

export function blocksToHtml(
  rawBlocks: ContentBlockRaw[] = [],
  opts: RawHtmlOptions = {}
): string {
  const options: Required<RawHtmlOptions> = {
    classPrefix: opts.classPrefix ?? ""
  }
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return ""
  return renderBlocks(rawBlocks, 0, options)
}
