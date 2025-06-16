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
pnpm add @mikemajara/notion-cms
```

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS("your-notion-api-key");

// Simple API - clean, JavaScript-friendly data
const { results } = await notionCms.getDatabase("your-database-id");
console.log(results[0].Title); // "My Blog Post"
console.log(results[0].Tags); // ["react", "typescript"]

// Query Builder - type-safe filtering and sorting
const posts = await notionCms
  .query("blog-database-id")
  .where("Status")
  .equals("Published")
  .sort("Created", "descending")
  .execute();
```

## Documentation

Get started quickly with our comprehensive guides:

- **[📚 Getting Started](./docs/getting-started.md)** - Your first steps with Notion CMS
- **[⚙️ Installation Guide](./docs/installation.md)** - Detailed setup and configuration
- **[🧠 Core Concepts](./docs/core-concepts.md)** - Understand the layered API architecture
- **[📖 API Reference](./docs/api-reference/)** - Complete API documentation
- **[💡 Examples](./docs/examples/)** - Real-world usage patterns and code samples

## Layered API Preview

Access your data at the level of detail you need:

```typescript
const { results } = await notionCms.getDatabase(databaseId);
const record = results[0];

// 🎯 Simple API - Clean JavaScript types
record.Title; // "My Blog Post"
record.Tags; // ["react", "typescript"]
record.PublishDate; // Date object

// 🔍 Advanced API - Rich metadata preserved
record.advanced.Tags;
// [{ id: "tag1", name: "react", color: "blue" }, ...]

// ⚡ Raw API - Complete Notion response
record.raw.properties.Title;
// Full Notion API response for debugging/advanced use
```

## Type Generation

Generate TypeScript types directly from your Notion databases:

```bash
npx notion-cms generate --database-id your-database-id
```

```typescript
import { BlogPostRecord } from "./generated-types";

// Fully typed database operations
const posts = await notionCms
  .query<BlogPostRecord>(databaseId)
  .where("Status")
  .equals("Published")
  .sort("PublishDate", "descending")
  .execute();
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
