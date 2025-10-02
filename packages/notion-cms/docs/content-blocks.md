# Content Blocks

This guide explains how to fetch block content, convert it into different shapes, and render it. It assumes you already initialised `NotionCMS`.

## Fetch raw blocks

```ts
const blocks = await notion.getPageContentRaw("<page-id>")
```

- Defaults to recursive fetching (`recursive = true`). Set `recursive: false` to fetch only the first level.
- Blocks include children and media URLs automatically processed by `FileManager`.

## Simple block objects

```ts
import { convertBlocksToSimple } from "@originui/notion-cms"

const simpleBlocks = await convertBlocksToSimple(blocks)
```

`SimpleBlock` items include:

- `id`, `type`, `content`, `hasChildren`, optional `children`.
- Table helpers (`SimpleTableBlock`, `SimpleTableRowBlock`) expose structured data.

### Media URLs and FileManager

When you provide a `FileManager`, media URLs are re-written using your configured strategy:

```ts
const simpleBlocks = await convertBlocksToSimple(blocks, {
  fileManager: myFileManager
})
```

## Advanced block objects

```ts
import { convertBlocksToAdvanced } from "@originui/notion-cms"

const advancedBlocks = await convertBlocksToAdvanced(blocks)
```

- Preserves captions as both plain text and markdown.
- Includes media expiry, callout icons, table row cell detail, columns, synced blocks, child entries, etc.
- Accepts `mediaUrlResolver` to customise media handling:

```ts
const advancedBlocks = await convertBlocksToAdvanced(blocks, {
  mediaUrlResolver: async (block, field) => {
    if (block.type === "image") {
      return await myCdn.store(field.file.url)
    }
    return field.file?.url ?? ""
  }
})
```

## Markdown rendering

```ts
import { blocksToMarkdown } from "@originui/notion-cms"

const markdown = blocksToMarkdown(blocks, {
  includeImages: true,
  listBullets: "-"
})
```

- Uses `groupConsecutiveListItems` internally for correct nesting.
- Options let you tweak list symbols, heading depth, or whether to emit image references.

## HTML rendering

```ts
import { blocksToHtml } from "@originui/notion-cms"

const html = blocksToHtml(blocks, {
  classPrefix: "notion-"
})
```

- Respects `classPrefix` for styling rich-text annotations.
- Outputs semantic tags (`<h1>`, `<ul>`, `<code>`, etc.).

## Combining pipelines

Common flows:

1. Fetch raw blocks via `getPageContentRaw`.
2. Convert to simple or advanced structures for custom UIs.
3. Generate markdown or HTML for static rendering or fallback content.

You can also process the raw blocks from Notion (without `getPageContentRaw`) if you already have them from another source. The converters accept any `ContentBlockRaw[]`.

## Handling pagination manually

`PageContentService` already iterates through API cursors, but if you need fine-grained control, you can call Notion’s API directly and then pass the results into these helpers. Be sure to enrich media URLs, as `PageContentService` does, before converting to avoid short-lived Notion links.
