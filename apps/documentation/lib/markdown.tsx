import { components } from "@/mdx-components"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkBreaks from "remark-breaks"
import rehypeExternalLinks from "rehype-external-links"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeRaw from "rehype-raw"
import rehypeKatex from "rehype-katex"

export const Markdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
      rehypePlugins={[
        // [rehypeAutolinkHeadings, { behavior: "wrap" }],
        [rehypeRaw],
        [
          rehypeExternalLinks,
          { target: "_blank", rel: ["noopener", "noreferrer"] }
        ],
        rehypeKatex
      ]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
