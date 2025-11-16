import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints"

const HTML_ESCAPE_REGEX = /[&<>"']/g
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}

export function escapeHtml(value: string): string {
  return value.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPES[char])
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value)
}

function wrap(content: string, tag: string, attributes?: string): string {
  return `<${tag}${attributes ? ` ${attributes}` : ""}>${content}</${tag}>`
}

export function richTextToPlain(rich: RichTextItemResponse[] = []): string {
  if (!Array.isArray(rich)) return ""
  return rich.map((item) => item.plain_text || "").join("")
}

export function richTextToHtml(rich: RichTextItemResponse[] = []): string {
  if (!Array.isArray(rich)) return ""

  return rich
    .map((item) => {
      const plain = escapeHtml(item.plain_text || "")
      const annotations = item.annotations
      let content = plain

      if (annotations.code) {
        content = wrap(content, "code")
      }
      if (annotations.bold) {
        content = wrap(content, "strong")
      }
      if (annotations.italic) {
        content = wrap(content, "em")
      }
      if (annotations.strikethrough) {
        content = wrap(content, "s")
      }
      if (annotations.underline) {
        content = wrap(content, "u")
      }
      if (annotations.color && annotations.color !== "default") {
        const colorAttr = escapeAttribute(annotations.color)
        content = wrap(content, "span", `data-color="${colorAttr}"`)
      }

      const href = (item as any).href as string | null | undefined
      if (href) {
        const safeHref = escapeAttribute(href)
        return wrap(content, "a", `href="${safeHref}"`)
      }

      return content
    })
    .join("")
}

