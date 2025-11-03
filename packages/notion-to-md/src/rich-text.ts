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
