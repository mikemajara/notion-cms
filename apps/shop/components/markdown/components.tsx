import { ArrowUpRight, Download } from "lucide-react"
import { Components } from "react-markdown"
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism"

const getFileExtension = (url: string) => {
  return url.split(".").pop()
}

const getFileType = (url: string) => {
  const extension = getFileExtension(url)
  return extension === "jpg" ||
    extension === "jpeg" ||
    extension === "png" ||
    extension === "gif" ||
    extension === "bmp" ||
    extension === "tiff" ||
    extension === "ico" ||
    extension === "webp" ||
    extension === ""
    ? "image"
    : "file"
}

export const components: Components = {
  img: ({ node, ...props }) => {
    console.log(`node`, node)
    console.log(`props`, props)

    return getFileType(props?.src || "") === "image" ? (
      <img src={props?.src || ""} alt={props?.alt || ""} {...props} />
    ) : (
      <a
        href={props?.src || ""}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        {props?.alt || ""} <ArrowUpRight className="size-4" />
      </a>
    )
  }
  // code({ node, inline, className, children, ...props }) {
  //   const match = /language-(\w+)/.exec(className || '')
  //   return !inline && match ? (
  //     <SyntaxHighlighter
  //       style={tomorrow}
  //       language={match[1]}
  //       PreTag="div"
  //       {...props}
  //     >
  //       {String(children).replace(/\n$/, '')}
  //     </SyntaxHighlighter>
  //   ) : (
  //     <code className={className} {...props}>
  //       {children}
  //     </code>
  //   )
  // },
  // h1: ({ children }) => (
  //   <h1 className="text-3xl font-bold mb-4 text-foreground">{children}</h1>
  // ),
  // h2: ({ children }) => (
  //   <h2 className="text-2xl font-semibold mb-3 text-foreground">{children}</h2>
  // ),
  // h3: ({ children }) => (
  //   <h3 className="text-xl font-medium mb-2 text-foreground">{children}</h3>
  // ),
  // p: ({ children }) => (
  //   <p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>
  // ),
  // ul: ({ children }) => (
  //   <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">{children}</ul>
  // ),
  // ol: ({ children }) => (
  //   <ol className="list-decimal list-inside mb-4 space-y-1 text-muted-foreground">{children}</ol>
  // ),
  // li: ({ children }) => (
  //   <li className="ml-4">{children}</li>
  // ),
  // blockquote: ({ children }) => (
  //   <blockquote className="border-l-4 border-primary pl-4 italic mb-4 text-muted-foreground">
  //     {children}
  //   </blockquote>
  // ),
  // a: ({ href, children }) => (
  //   <a
  //     href={href}
  //     className="text-primary hover:underline"
  //     target="_blank"
  //     rel="noopener noreferrer"
  //   >
  //     {children}
  //   </a>
  // ),
  // strong: ({ children }) => (
  //   <strong className="font-semibold text-foreground">{children}</strong>
  // ),
  // em: ({ children }) => (
  //   <em className="italic">{children}</em>
  // ),
}
