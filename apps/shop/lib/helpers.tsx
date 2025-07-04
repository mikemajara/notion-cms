import { SimpleBlock } from "@mikemajara/notion-cms";
import Image from "next/image";

// Helper function to render different types of blocks
export function renderBlock(block: SimpleBlock) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="mb-4">
          {block.content?.richText?.map((text: any, index: number) => (
            <span
              key={index}
              className={`
                ${text.annotations?.bold ? "font-bold" : ""}
                ${text.annotations?.italic ? "italic" : ""}
                ${text.annotations?.underline ? "underline" : ""}
                ${text.annotations?.strikethrough ? "line-through" : ""}
                ${
                  text.annotations?.code
                    ? "bg-gray-100 px-1 rounded font-mono text-sm"
                    : ""
                }
              `}
            >
              {text.text?.content || ""}
            </span>
          )) || block.content?.text}
        </p>
      );

    case "heading_1":
      return (
        <h1 className="text-3xl font-bold mb-4">{block.content?.text || ""}</h1>
      );

    case "heading_2":
      return (
        <h2 className="text-2xl font-semibold mb-3">
          {block.content?.text || ""}
        </h2>
      );

    case "heading_3":
      return (
        <h3 className="text-xl font-medium mb-2">
          {block.content?.text || ""}
        </h3>
      );

    case "bulleted_list_item":
      return <li className="ml-4 mb-2">{block.content?.text || ""}</li>;

    case "numbered_list_item":
      return <li className="ml-4 mb-2">{block.content?.text || ""}</li>;

    case "link_preview":
    case "embed":
    case "bookmark":
    case "file":
      return (
        <a
          href={block.content?.url || ""}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-blue-500 hover:underline visited:text-purple-500"
        >
          {block.content?.caption || block.content?.url}
        </a>
      );

    case "image": {
      const imageUrl = block.content?.url;
      const imageCaption = block.content?.caption || "";

      if (imageUrl) {
        return (
          <div className="my-6">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={imageUrl}
                alt={imageCaption || "Image"}
                fill
                className="object-cover"
              />
            </div>
            {imageCaption && (
              <p className="text-sm text-muted-foreground mt-2 text-center italic">
                {imageCaption}
              </p>
            )}
          </div>
        );
      }
      return null;
    }

    case "divider":
      return <hr className="my-6 border-border" />;

    case "quote":
      return (
        <blockquote className="border-l-4 border-primary pl-4 italic my-4">
          {block.content?.text || ""}
        </blockquote>
      );

    case "code": {
      const codeText = block.content?.text || "";
      const language = block.content?.language || "";

      return (
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">
          <code className={`text-sm ${language ? `language-${language}` : ""}`}>
            {codeText}
          </code>
        </pre>
      );
    }

    default: {
      // For unsupported block types, try to extract text content
      const text = block.content?.text || "";
      return text ? <div className="mb-4">{text}</div> : null;
    }
  }
}
