# @mikemajara/notion-to-md

Utility helpers that turn raw Notion block responses into Markdown and plain text. The implementation mirrors the conversion pipeline used internally in `@mikemajara/notion-cms`, packaged for standalone consumption.

## Installation

```bash
pnpm add @mikemajara/notion-to-md @notionhq/client
```

The Notion SDK is a peer dependency so you control how requests are made.

## Quick start

```ts
import { Client } from "@notionhq/client"
import { blocksToMarkdown } from "@mikemajara/notion-to-md"

const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function renderPage(blockId: string) {
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100
  })
  const markdown = blocksToMarkdown(response.results)

  console.log(markdown)
}
```

Pass the blocks from any Notion `list` response and receive a Markdown string ready for rendering or storage.

## API

- `blocksToMarkdown(blocks, options?)` – converts an array of Notion blocks into Markdown. Optional `options`:
  - `listIndent` (default: two spaces) lets you control the indent string for nested lists.
  - `debug` adds visible placeholders for unsupported block types so you can spot gaps during development.
- `richTextToMarkdown(richText)` – converts a Notion rich text array into Markdown inline content.
- `richTextToPlain(richText)` – converts the same rich text into plain text.

All helpers accept the raw Notion SDK response objects; you do not need extra adapters or transformations.

## Current limitations

- Image and file blocks surface the original signed URLs but the package does not manage downloading or caching assets.
- Blocks without first-class support fall back to `[unsupported]` placeholders with their Notion identifiers when `debug` is enabled.
- The converter expects children for nested structures (toggles, lists, columns) to be pre-fetched.

Contributions and feedback are welcome—open an issue in `notion-cms` if you run into missing block types or discover incorrect markdown output.
