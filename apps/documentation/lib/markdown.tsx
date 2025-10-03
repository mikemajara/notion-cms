import { components } from "@/mdx-components"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeExternalLinks from "rehype-external-links"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeAutolinkHeadings from "rehype-autolink-headings"

const rehypePlugins = [
  // [rehypeAutolinkHeadings, { behavior: "wrap" }],
  [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }]
]

export const Markdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // rehypePlugins={rehypePlugins}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
