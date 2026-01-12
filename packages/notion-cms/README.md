# Notion CMS

A TypeScript-first library for using Notion as a headless CMS with a powerful layered API architecture.

## Why Notion CMS?

Transform your Notion databases into a powerful, type-safe CMS that works perfectly for blogs, documentation sites, dashboards, and more. Get the simplicity of Notion with the flexibility of a modern API.

## Key Features

- 🎯 **Layered API**: Access data at three levels - Simple (clean JS types), Advanced (rich metadata), or Raw (complete Notion response)
- 🔍 **Type-Safe Queries**: Build complex, type-safe database queries with filters, sorting, and pagination
- ⚡ **Automatic Type Generation**: Generate TypeScript types directly from your Notion databases
- 📝 **Content Transformation**: Convert Notion blocks to Markdown or HTML with high fidelity
- 🚀 **Zero Configuration**: Works out of the box with minimal setup

## Quick Start

```bash
pnpm add @notion-utils/cms @notionhq/client
```

> Install `@aws-sdk/client-s3` if you plan to use the bundled S3 storage adapter.

```typescript
import { NotionCMS } from "./notion" // Generated entrypoint re-exports NotionCMS

const notionCms = new NotionCMS(process.env.NOTION_API_KEY as string)

// Query with type safety - generate types first!
const clients = await notionCms
  .query("eRPDataSourceClients", { recordType: "simple" })
  .all()

console.log(clients[0]["Client Name"]) // "Acme Corp"
console.log(clients[0].Email) // "contact@acme.com"
console.log(clients[0].Tags) // ["VIP", "Active"]

// Filter and sort with full type safety
const activeClients = await notionCms
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Status", "equals", "Active")
  .sort("Last Contact", "descending")
  .all()
```

> The generator creates an index file (e.g. `./notion/index.ts`) that registers your databases and re-exports `NotionCMS`. Import from that generated path wherever you bootstrap the client.

## Documentation

Get started quickly with our comprehensive guides:

- **[📚 Getting Started](./docs/01-getting-started.md)** - Installation and basic usage
- **[🧠 Core Concepts](./docs/02-core-concepts.md)** - Understand the three-layer API architecture
- **[⚙️ Type Generation](./docs/03-type-generation.md)** - Generate TypeScript types from your Notion databases
- **[🚢 Release Checklist](./docs/99-release-checklist.md)** - Steps to prepare and publish new versions

## Layered API Preview

Access your data at the level of detail you need:

```typescript
// 🎯 Simple Layer - Clean JavaScript types (default)
const simple = await notionCms
  .query("myDatabase", { recordType: "simple" })
  .single()
simple.Title // "My Blog Post"
simple.Tags // ["react", "typescript"]
simple.PublishDate // Date object

// 🔍 Advanced Layer - Rich metadata preserved
const advanced = await notionCms
  .query("myDatabase", { recordType: "advanced" })
  .single()
advanced.Tags // [{ id: "tag1", name: "react", color: "blue" }, ...]
advanced.Status // { id: "status1", name: "Published", color: "green" }

// ⚡ Raw Layer - Complete Notion API response
const raw = await notionCms.query("myDatabase", { recordType: "raw" }).single()
raw.properties.Title // Full Notion API structure
```

## Type Generation

Generate TypeScript types directly from your Notion databases:

```bash
npx notion-cms generate \
  --token your-notion-api-token \
  --database your-database-id \
  --output ./notion
```

```typescript
import { NotionCMS } from "./notion"

const notionCms = new NotionCMS(process.env.NOTION_API_KEY as string)

const posts = await notionCms
  .query("myDatabase", { recordType: "simple" })
  .filter("Status", "equals", "Published")
  .sort("PublishDate", "descending")
  .all()
```

## License

MIT

## Roadmap

- [ ] blocksToMarkdown should add the markdown language. Currently blocksToMarkdown receives a SimpleBlock, but more context should be added, using the Advanced or Raw layers
- [ ] Functions should support the type and be part of the schema pull when `generate-types` is run.
- [ ] Table is currently unsupported. Should be supported. Easy add

## Issues

- [ ] Numbered list, with nested bullet list is not correctly parsed from Notion. Not sure if this is Markdown rendering issue or `blocksToMarkdown` not generating the right indentation
- [ ]
