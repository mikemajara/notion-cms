# Getting Started

Welcome to Notion CMS! This guide will help you get up and running with the library in just a few minutes.

## What is Notion CMS?

Notion CMS is a TypeScript-first library that transforms your Notion databases into a powerful, type-safe CMS. Think of it like **Prisma or Drizzle ORM**, but for Notion instead of SQL databases. It provides:

- **Type-safe queries** with full TypeScript autocomplete
- **Automatic type generation** from your Notion databases
- **Three-layer API** - access data at the level of detail you need
- **Content conversion** - transform Notion blocks to Markdown or HTML
- **File management** - handle Notion-hosted files with caching strategies

## Installation

Install the library using your preferred package manager:

```bash
# Using pnpm (recommended)
pnpm add @mikemajara/notion-cms

# Using npm
npm install @mikemajara/notion-cms

# Using yarn
yarn add @mikemajara/notion-cms
```

You'll also need the Notion API client as a peer dependency:

```bash
pnpm add @notionhq/client
```

### Optional: File Storage

If you plan to use file caching (local or S3), install the AWS SDK:

```bash
pnpm add @aws-sdk/client-s3
```

## Prerequisites

Before you begin, you'll need:

1. **A Notion account** with access to databases you want to use
2. **A Notion integration** with API access:
   - Go to [notion.so/my-integrations](https://notion.so/my-integrations)
   - Create a new integration
   - Copy the "Internal Integration Token"
   - Share your databases with the integration
3. **A Notion database** - this will be your data source

## Quick Start

### Step 1: Generate TypeScript Types

First, generate TypeScript types from your Notion database. This is similar to running `prisma generate` or running migrations in Drizzle.

```bash
npx notion-cms generate \
  --token your-notion-api-token \
  --database your-database-id \
  --output ./notion
```

This command will:

- Connect to your Notion database
- Discover all data sources within it
- Generate TypeScript types for each data source
- Create type-safe query methods
- Output files to the `./notion` directory

**Note:** The `--database` parameter accepts a Notion database ID. You can find this in your database URL:

```
https://notion.so/workspace/YOUR-DATABASE-ID?v=...
```

### Step 2: Import Generated Types

After generation, import the types in your code:

```typescript
import { NotionCMS } from "./notion"

// The generated types automatically register with NotionCMS
// You can now use type-safe queries!
```

### Step 3: Initialize NotionCMS

Create an instance of NotionCMS with your API token:

```typescript
import { NotionCMS } from "./notion"

const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
```

### Step 4: Query Your Data

Now you can query your database with full type safety:

```typescript
// Query all records (Simple layer - clean JS types)
const clients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .all()

// Access properties with autocomplete
clients.forEach((client) => {
  console.log(client["Client Name"]) // Fully typed!
  console.log(client.Email) // TypeScript knows this exists
  console.log(client.Tags) // Array of strings
})
```

## Basic Usage Patterns

### Querying Records

The query builder provides several methods to fetch data:

```typescript
// Get all records
const allRecords = await notionCMS
  .query("yourDatabaseKey", { recordType: "simple" })
  .all()

// Get a single record
const singleRecord = await notionCMS
  .query("yourDatabaseKey", { recordType: "simple" })
  .single()

// Execute with pagination
const { results, hasMore, nextCursor } = await notionCMS
  .query("yourDatabaseKey", { recordType: "simple" })
  .execute()
```

### Filtering and Sorting

Build type-safe queries with filters and sorting:

```typescript
const activeClients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Status", "equals", "Active")
  .sort("Last Contact", "descending")
  .all()
```

### Accessing Page Content

Retrieve and convert page content blocks:

```typescript
import { blocksToMarkdown } from "@mikemajara/notion-cms"

const pageId = "your-page-id"
const blocks = await notionCMS.getPageContent(pageId)
const markdown = blocksToMarkdown(blocks)

console.log(markdown) // Full markdown content
```

## Configuration

NotionCMS works out of the box with zero configuration, but you can customize file handling and debugging:

```typescript
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "direct", // or "local" or "remote"
    storage: {
      path: "./public/assets/notion-files"
    }
  },
  debug: {
    enabled: true,
    level: "info" // "error" | "warn" | "info" | "debug"
  }
})
```

## Environment Variables

It's recommended to store your Notion API token in environment variables:

```bash
# .env
NOTION_API_KEY=secret_your_token_here
```

```typescript
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
```

## Next Steps

- Learn about the **[Three-Layer API](./02-core-concepts.md)** architecture
- Understand **[Type Generation](./03-type-generation.md)** in detail
- Explore **[Querying Data](./04-querying-data.md)** with filters and sorting
- See **[Real-World Examples](./07-examples.md)** from the monorepo

## Common Issues

### "Database not found in registry"

Make sure you've:

1. Run `notion-cms generate` to create types
2. Imported the generated types file in your code
3. Used the correct database key (from the generated types)

### "Missing dataSourceId configuration"

Regenerate your types - this happens when the database structure has changed or types were generated with an older version.

### Type errors with query methods

Ensure you're using the database key exactly as it appears in your generated types file. The key is case-sensitive and typically follows the pattern `dataSourceName`.

## Getting Help

- Check the [Limitations & Known Issues](./08-limitations.md) guide
- Review the [Supportability Matrices](./08-limitations.md#supportability-matrices)
- Explore example apps in the [monorepo](https://github.com/mikemajara/notion-cms)
