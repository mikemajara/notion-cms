import { components } from "@/mdx-components"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeExternalLinks from "rehype-external-links"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeRaw from "rehype-raw"

export const Markdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        // [rehypeAutolinkHeadings, { behavior: "wrap" }],
        [rehypeRaw],
        [
          rehypeExternalLinks,
          { target: "_blank", rel: ["noopener", "noreferrer"] }
        ]
      ]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
