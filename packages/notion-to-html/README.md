# @notion-utils/html

Utility helpers that turn raw Notion block responses into semantic HTML.

- No runtime dependencies
- Accepts plain Notion SDK responses (blocks with `children` pre-fetched)

## Installation

```bash
pnpm add @notion-utils/html @notionhq/client
```

The Notion SDK remains a peer dependency so you control network behaviour.

## Quick start

```ts
import { Client } from "@notionhq/client"
import { blocksToHtml } from "@notion-utils/html"

const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function renderPage(blockId: string) {
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100
  })

  const html = blocksToHtml(response.results)
  console.log(html)
}
```

Pass any array of Notion blocks (with `children` included for nested
structures) and receive an HTML string ready to embed in your website.

## API

- `blocksToHtml(blocks, options?)` – converts an array of Notion blocks into
  HTML. Options:
  - `debug` (default `false`) shows placeholders for unsupported blocks.
  - `listClassName` applies a CSS class to root `<ul>` and `<ol>` wrappers.
  - `todoClassName` applies a CSS class to the to-do `<ul>` wrapper.
  - `columnClassName` applies a CSS class to column wrappers.
  - `plugins` registers `HtmlPlugin` instances that can post-process the rendered node tree.
- `richTextToHtml(richText)` – converts a Notion rich text array into HTML,
  respecting annotations and hyperlinks.
- `richTextToPlain(richText)` – converts rich text to plain text (useful for
  code blocks).

## Structured output

Every element generated from a Notion block receives two data attributes by default:

- `data-level` – zero-based depth within the block tree (useful for CSS styling of nested content).
- `data-type` – original Notion block type that produced the element, even when multiple blocks render to the same HTML tag (e.g. `bookmark`, `embed`, and `link_preview` all surface as `<a>` but retain their source type).

This metadata makes it possible to style or select blocks declaratively without writing any JavaScript.

## Plugin hooks

You can extend the renderer with lightweight post-processing plugins. Plugins receive each node in a single depth-first traversal, can mutate attributes, replace nodes entirely, and keep per-render state.

```ts
import type { HtmlPlugin } from "@notion-utils/html"
import { blocksToHtml } from "@notion-utils/html"

const alternatingBullets: HtmlPlugin = {
  id: "alternate-bullets",
  postProcess(node, ctx) {
    if (node.kind !== "element") return
    if (node.tagName === "ul" && node.attributes["data-type"] === "bulleted_list_item") {
      ctx.setState(`list:${node.meta.blockId ?? ctx.level}`, 0)
      return
    }

    if (node.tagName !== "li" || node.attributes["data-type"] !== "bulleted_list_item") {
      return
    }

    const listKey = `list:${ctx.ancestors.at(-1)?.meta.blockId ?? "global"}`
    const count = ctx.getState<number>(listKey) ?? 0
    ctx.setState(listKey, count + 1)
    const next = count + 1
    node.attributes.style =
      next % 2 === 0 ? "list-style-type: circle" : "list-style-type: disc"
  }
}

const html = blocksToHtml(blocks, { plugins: [alternatingBullets] })
```

Need to replace a block entirely? Return a new node created through the plugin context so metadata stays intact:

```ts
const customBookmark: HtmlPlugin = {
  id: "bookmark-component",
  postProcess(node, ctx) {
    if (node.kind !== "element") return
    if (node.tagName !== "figure" || node.attributes["data-type"] !== "bookmark") return

    const href = ctx.block && (ctx.block as any).bookmark?.url
    const component = ctx.createElement("Bookmark", { href: href ?? "" })
    component.children.push(ctx.createText("Fancy Bookmark"))
    return component
  }
}
```

Plugins execute in registration order (use the optional `priority` field to control execution). Each plugin gets its own render-scoped key/value store via `getState` / `setState` and can call `skipRemaining()` to short-circuit later plugins for the current node.

## Current limitations

- Media blocks surface the original signed URLs but do not manage asset
  caching or expiry.
- Equation rendering currently returns plain text with a data attribute; you
  can hydrate this with a math renderer of your choosing.
- Unsupported blocks only appear when `debug` is enabled.

See `docs/block-coverage.md` for the full block matrix and planned styling hooks.

