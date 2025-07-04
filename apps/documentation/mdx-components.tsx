import type { MDXComponents } from "mdx/types";
import type { FC } from "react";
import { codeToHtml } from "shiki";
import Link from "next/link";
import Image from "next/image";
import { LinkIcon } from "lucide-react";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";

// @ts-ignore
import { InlineMath, BlockMath } from "react-katex";

import { BlockSideTitle } from "@/components/block-sidetitle";
import CopyButton from "@/components/copy-button";

export const components: Record<string, FC<any>> = {
  h1: (props) => (
    <div className="flex items-center gap-2 pt-2 mb-6">
      <h1
        className="text-2xl font-bold text-primary text-balance"
        id={props.children.replaceAll(" ", "-")}
        {...props}
      />
      <Link href={`#${props.children.replaceAll(" ", "-")}`}>
        <LinkIcon className="w-4 h-4" />
      </Link>
    </div>
  ),
  h2: (props) => (
    <div className="flex items-center gap-2 mb-6 pt-7">
      <h2
        className="text-xl font-semibold text-primary text-balance"
        id={props.children.replaceAll(" ", "-")}
        {...props}
      />
      <Link href={`#${props.children.replaceAll(" ", "-")}`}>
        <LinkIcon className="w-4 h-4" />
      </Link>
    </div>
  ),
  h3: (props) => (
    <div className="flex items-center gap-2 mb-6 pt-7">
      <h3
        className="text-lg font-regular text-primary text-balance"
        id={props.children.replaceAll(" ", "-")}
        {...props}
      />
      <Link href={`#${props.children.replaceAll(" ", "-")}`}>
        <LinkIcon className="w-4 h-4" />
      </Link>
    </div>
  ),
  ul: (props) => (
    <ul
      className="pl-5 list-disc list-outside mt-2 marker:text-primary"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="pl-5 list-decimal list-outside mt-2 marker:text-primary"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1.5" {...props} />,
  a: ({ href, ...props }) => {
    return (
      <Link
        className="underline break-words decoration-from-font underline-offset-2 decoration-secondary hover:decoration-primary focus:outline-none focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-opacity-50 focus-visible:ring-offset-2"
        href={href}
        draggable={false}
        {...(href?.startsWith("https://")
          ? {
              target: "_blank",
              rel: "noopener noreferrer",
            }
          : {})}
        {...props}
      />
    );
  },
  strong: (props) => <strong className="font-bold" {...props} />,
  p: (props) => <p className="mt-2" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="pl-6 -ml-6 sm:pl-10 sm:-ml-10 md:pl-14 md:-ml-14 not-mobile:text-primary"
      {...props}
    />
  ),
  pre: (props) => (
    <div className="relative w-full">
      <pre
        className="w-0 min-w-full bg-transparent border rounded-md border-secondary p-4 px-8 mt-7 py-6 overflow-x-scroll"
        {...props}
      />
    </div>
  ),
  code: async (props) => {
    if (typeof props.children === "string") {
      const code = await codeToHtml(props.children, {
        lang: props.className?.replace("language-", "") || "text",
        theme: "github-light",
        // theme: 'min-light',
        // theme: 'snazzy-light',
        transformers: [
          {
            // Since we're using dangerouslySetInnerHTML, the code and pre
            // tags should be removed.
            pre: (hast) => {
              if (hast.children.length !== 1) {
                throw new Error("<pre>: Expected a single <code> child");
              }
              if (hast.children[0].type !== "element") {
                throw new Error("<pre>: Expected a <code> child");
              }
              return hast.children[0];
            },
            postprocess(html) {
              return html.replace(/^<code>|<\/code>$/g, "");
            },
          },
          transformerNotationHighlight(),
          transformerNotationDiff(),
        ],
      });

      return (
        <>
          <code
            className="block text-xs sm:text-sm"
            dangerouslySetInnerHTML={{ __html: code }}
          />
          <CopyButton
            textToCopy={props.children}
            className="absolute w-3 h-3 top-2 right-2"
          />
        </>
      );
    }

    return <code className="inline" {...props} />;
  },
  Image,
  hr: (props) => <hr className="w-24 my-14 border-secondary" {...props} />,
  table: (props) => (
    <div className="overflow-x-auto my-6 w-0 min-w-full border rounded-md">
      <table {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-muted/50" {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: (props) => (
    <tr
      className="border-b border-secondary hover:bg-muted/30 transition-colors"
      {...props}
    />
  ),
  th: (props) => (
    <th
      className="p-3 text-left font-semibold text-primary border-r border-secondary last:border-r-0"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="p-3 text-sm border-r border-secondary last:border-r-0"
      {...props}
    />
  ),
  BlockSideTitle,
  InlineMath,
  BlockMath,
};

export function useMDXComponents(inherited: MDXComponents): MDXComponents {
  return {
    ...inherited,
    ...components,
  };
}
