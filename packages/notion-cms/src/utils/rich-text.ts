import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints"

function applyAnnotations(
  text: string,
  annotations: RichTextItemResponse["annotations"]
): string {
  let result = text
  if (annotations.code) {
    result = `\`${result}\``
  }
  if (annotations.bold) {
    result = `**${result}**`
  }
  if (annotations.italic) {
    result = `*${result}*`
  }
  if (annotations.strikethrough) {
    result = `~~${result}~~`
  }
  // underline and color intentionally ignored per spec
  return result
}

export function richTextToPlain(rich: RichTextItemResponse[] = []): string {
  if (!Array.isArray(rich)) return ""
  return rich.map((item) => item.plain_text || "").join("")
}

export function richTextToMarkdown(rich: RichTextItemResponse[] = []): string {
  if (!Array.isArray(rich)) return ""

  return rich
    .map((item) => {
      const baseText = item.plain_text || ""
      const annotated = applyAnnotations(baseText, item.annotations)
      const href = (item as any).href as string | null | undefined
      if (href) {
        return `[${annotated}](${href})`
      }
      return annotated
    })
    .join("")
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function richTextToHtml(
  rich: RichTextItemResponse[] = [],
  classPrefix: string = ""
): string {
  if (!Array.isArray(rich)) return ""

  const prefix = classPrefix || ""

  return rich
    .map((item) => {
      let content = escapeHtml(item.plain_text || "")
      const { bold, italic, strikethrough, code, color } = item.annotations

      if (code) content = `<code>${content}</code>`
      if (bold) content = `<strong>${content}</strong>`
      if (italic) content = `<em>${content}</em>`
      if (strikethrough) content = `<s>${content}</s>`

      const classes: string[] = []
      if (color && color !== "default") {
        if (color.endsWith("_background")) {
          const base = color.replace("_background", "")
          classes.push(`${prefix}bg-${base}`)
        } else {
          classes.push(`${prefix}color-${color}`)
        }
      }

      if (classes.length) {
        content = `<span class="${classes.join(" ")}">${content}</span>`
      }

      const href = (item as any).href as string | null | undefined
      if (href) {
        const safeHref = escapeHtml(href)
        return `<a href="${safeHref}">${content}</a>`
      }
      return content
    })
    .join("")
}
