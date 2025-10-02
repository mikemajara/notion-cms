# Getting Started

This guide shows how to install Notion CMS, configure your first client, and run a simple database query. It assumes you already have a Notion integration token and at least one database.

## Install

```bash
pnpm add @originui/notion-cms @notionhq/client
```

> Use `pnpm` whenever possible; swap for `npm`/`yarn` only if your project requires it.

## Create a NotionCMS instance

```ts
import { NotionCMS } from "@originui/notion-cms"

const notion = new NotionCMS(process.env.NOTION_TOKEN!)
```

- Provide a Notion integration token with read access to your target databases.
- Optional configuration (file caching, debug logging) is covered in `configuration.md`.

## Register generated types (optional but recommended)

The CLI generator produces database-specific metadata that powers autocomplete and runtime validation. If you already generated types, register them before querying:

```ts
import "./notion-types-blog"

// Generated file example
registerDatabase("blog", {
  id: "<database-id>",
  fields: {
    Title: { type: "title" },
    Status: { type: "status", options: ["Draft", "Published"] }
  }
})
```

Without registrations you can still query by passing raw database IDs to `notion.query()`.

## Run your first query

```ts
const posts = await notion
  .query("blog")
  .filter("Status", "equals", "Published")
  .sort("PublishedAt", "descending")
  .limit(5)

console.log(posts)
```

- The default layer is `simple`; each record is a flat JavaScript object.
- Switch to `advanced` or `raw` layers using `.query("blog", { recordType: "advanced" })`.

## Fetch page content

```ts
const blocks = await notion.getPageContentRaw("<page-id>")
```

Process the blocks with the helpers documented in `content-blocks.md`.

## Next steps

- Configure file handling and the code generator in `configuration.md`.
- Explore query patterns in `database-queries.md`.
- Learn about block conversion and rendering in `content-blocks.md`.
