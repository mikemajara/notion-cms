# Notion CMS

A simplified API for using Notion as a headless CMS with TypeScript support.

## Features

- 🔄 **Simple Data Access**: Get simplified database records with JavaScript-friendly types
- 🧰 **Layered API**: Access data at different levels of detail (simple, advanced, raw)
- 🔍 **Type Safe Queries**: Build type-safe database queries with filter and sort
- 📃 **Pagination Support**: Automatically handle pagination for large datasets
- 📝 **Content Blocks**: Fetch and transform Notion content blocks to Markdown or HTML

## Installation

```bash
npm install notion-cms
# or
yarn add notion-cms
# or
pnpm add notion-cms
```

## Quick Start

```typescript
import { NotionCMS } from "notion-cms";

// Initialize with your Notion API key
const notionCms = new NotionCMS("your-notion-api-key");

// Fetch all records from a database
const { results } = await notionCms.getDatabase("your-database-id");

// Work with the simplified records
console.log(results[0].Title); // Directly access a title property
console.log(results[0].Tags); // Access a multi-select property (as string[])
```

## Layered API Approach

Notion CMS provides a layered API to access database records at different levels of detail:

### 1. Simple API (Default)

The simple API converts Notion's complex property types into simple JavaScript types:

```typescript
// Using the simple API (backward compatible)
const { results } = await notionCms.getDatabase(databaseId);
const record = results[0];

// Access properties directly
console.log(record.Title); // "My Page Title" (string)
console.log(record["Resource Type"]); // "EC2" (string)
console.log(record.Tags); // ["api", "database"] (string[])
console.log(record.CreatedAt); // JavaScript Date object
```

### 2. Advanced API

The advanced API preserves more metadata from Notion properties while still providing a clean interface:

```typescript
// Using the advanced API
const { results } = await notionCms.getDatabaseAdvanced(databaseId);
const record = results[0];

// Simple access still works
console.log(record.Title); // "My Page Title"

// Advanced access provides more details
console.log(record.advanced.Title);
// [{ content: "My Page Title", annotations: {...}, href: null, ... }]

console.log(record.advanced["Resource Type"]);
// { id: "t|O@", name: "EC2", color: "yellow" }

console.log(record.advanced.Tags);
// [{ id: "abc123", name: "api", color: "blue" }, { id: "def456", name: "database", color: "green" }]
```

### 3. Raw API

For complete access to Notion's API response:

```typescript
// Using the advanced API
const { results } = await notionCms.getDatabaseAdvanced(databaseId);
const record = results[0];

// Access the raw Notion API response for a property
console.log(record.raw.properties.Title);
// The complete unmodified Notion API response for this property
```

## Database Queries

### Simple Queries

```typescript
// Get all records from a database
const { results } = await notionCms.getDatabase("your-database-id");

// With pagination
const { results, nextCursor, hasMore } = await notionCms.getDatabase(
  "your-database-id",
  { pageSize: 10 }
);

// Get all records with automatic pagination
const allRecords = await notionCms.getAllDatabaseRecords("your-database-id");
```

### Advanced Queries (with Layered API)

```typescript
// Get records with the advanced layered API
const { results } = await notionCms.getDatabaseAdvanced("your-database-id");

// With pagination
const { results, nextCursor, hasMore } = await notionCms.getDatabaseAdvanced(
  "your-database-id",
  { pageSize: 10 }
);

// Get all records with automatic pagination
const allRecords = await notionCms.getAllDatabaseRecordsAdvanced(
  "your-database-id"
);
```

### Advanced Filtering & Sorting

```typescript
// Using the query builder
const results = await notionCms
  .query("your-database-id")
  .filter("Status")
  .equals("Active")
  .filter("Priority")
  .greaterThan(3)
  .sort("CreatedAt", "descending")
  .sort("Title", "ascending")
  .limit(20)
  .all();
```

## Working with Page Content

```typescript
// Get page content blocks
const blocks = await notionCms.getPageContent("your-page-id");

// Convert blocks to Markdown
const markdown = notionCms.blocksToMarkdown(blocks);

// Convert blocks to HTML
const html = notionCms.blocksToHtml(blocks);
```

## Example: Multi-Select & Rich Text Properties

```typescript
// Using the advanced API
const record = await notionCms.getRecordAdvanced("your-page-id");

// Multi-Select example
console.log(record["Resource Type"]); // "EC2" (simple string value)

console.log(record.advanced["Resource Type"]);
// {
//   id: "t|O@",
//   name: "EC2",
//   color: "yellow"
// }

// Rich Text example
console.log(record.Description);
// "A dark green leafy vegetable" (as Markdown)

console.log(record.advanced.Description);
// [
//   { content: "A dark ", annotations: { bold: false, ... }, href: null },
//   { content: "green", annotations: { color: "green", ... }, href: null },
//   { content: " leafy vegetable", annotations: { ... }, href: null }
// ]

// Raw Notion data
console.log(record.raw.properties.Description);
// Full raw Notion API response
```

## API Reference

See [API Documentation](docs/api.md) for full details.

## License

MIT
