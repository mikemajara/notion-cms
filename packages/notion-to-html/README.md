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
- `richTextToHtml(richText)` – converts a Notion rich text array into HTML,
  respecting annotations and hyperlinks.
- `richTextToPlain(richText)` – converts rich text to plain text (useful for
  code blocks).

## Current limitations

- Media blocks surface the original signed URLs but do not manage asset
  caching or expiry.
- Equation rendering currently returns plain text with a data attribute; you
  can hydrate this with a math renderer of your choosing.
- Unsupported blocks only appear when `debug` is enabled.

See `docs/block-coverage.md` for the full block matrix and planned styling hooks.

