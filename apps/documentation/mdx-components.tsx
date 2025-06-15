import type { MDXComponents } from "mdx/types";
import type { FC } from "react";
import { codeToHtml, createCssVariablesTheme } from "shiki";
import Link from "next/link";
import Image from "next/image";

// @ts-ignore
import { InlineMath, BlockMath } from "react-katex";

import { BlockSideTitle } from "@/components/block-sidetitle";

const cssVariablesTheme = createCssVariablesTheme({});

export const components: Record<string, FC<any>> = {
  h1: (props) => (
    <h1
      className="font-semibold mb-7 text-rurikon-600 text-balance"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="font-semibold mt-14 mb-7 text-rurikon-600 text-balance"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="font-semibold mt-14 mb-7 text-rurikon-600 text-balance"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="pl-5 list-disc list-outside mt-7 marker:text-rurikon-200"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="pl-5 list-decimal list-outside mt-7 marker:text-rurikon-200"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1.5" {...props} />,
  a: ({ href, ...props }) => {
    return (
      <Link
        className="underline break-words decoration-from-font underline-offset-2 decoration-rurikon-300 hover:decoration-rurikon-600 focus:outline-none focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-opacity-50 focus-visible:ring-offset-2"
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
  p: (props) => <p className="mt-7" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="pl-6 -ml-6 sm:pl-10 sm:-ml-10 md:pl-14 md:-ml-14 not-mobile:text-rurikon-400"
      {...props}
    />
  ),
  pre: (props) => (
    <pre className="whitespace-pre mt-7 md:whitespace-pre-wrap" {...props} />
  ),
  code: async (props) => {
    if (typeof props.children === "string") {
      const code = await codeToHtml(props.children, {
        lang: "jsx",
        theme: cssVariablesTheme,
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
        ],
      });

      return (
        <code
          className="inline shiki css-variables text-[0.805rem] sm:text-[13.8px] md:text-[0.92rem]"
          dangerouslySetInnerHTML={{ __html: code }}
        />
      );
    }

    return <code className="inline" {...props} />;
  },
  Image,
  img: async ({ src, alt, title }) => {
    let img: React.ReactNode;

    if (src.startsWith("https://")) {
      img = (
        <Image
          className="mt-7"
          src={src}
          alt={alt}
          quality={95}
          placeholder="blur"
          draggable={false}
        />
      );
    } else {
      const image = await import("./assets/images/" + src);
      img = (
        <Image
          className="mt-7"
          src={image.default}
          alt={alt}
          quality={95}
          placeholder="blur"
          draggable={false}
        />
      );
    }

    if (title) {
      return <BlockSideTitle title={title}>{img}</BlockSideTitle>;
    }

    return img;
  },
  hr: (props) => <hr className="w-24 my-14 border-rurikon-border" {...props} />,
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
