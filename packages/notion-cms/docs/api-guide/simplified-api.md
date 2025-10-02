---
title: "Simplified API"
description: "Learn how to use the simplified API layer for clean, JavaScript-friendly data access."
date: "2024-01-18"
---

# Simplified API

The Simplified API transforms Notion's complex property types into clean JavaScript types that are easy to work with. This is the recommended starting point for most users.

## Why Use the Simplified API?

- **Clean data types**: `string`, `number`, `Date`, `boolean`, `string[]`
- **No complex objects**: Direct property access without nested structures
- **Perfect for content**: Ideal for blogs, websites, and simple integrations
- **Fast development**: Get started quickly without learning Notion's data structures

## Basic Usage

```typescript
import {
  NotionCMS,
  convertRecordToSimple,
  convertRecords,
  convertBlocksToSimple,
  convertBlocksToAdvanced
} from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

const { results } = await cms.getDatabase("your-database-id")

// Receive enriched raw records
const post = results[0]

// Convert to the Simple layer when needed
const simplePost = await convertRecordToSimple(post)
console.log(simplePost.Title) // "My Blog Post"
console.log(simplePost.Tags) // ["react", "typescript"]
console.log(simplePost.PublishDate) // Date object
console.log(simplePost.Published) // true
```

## Property Type Conversions

| Notion Property | Simplified Type | Example Value                           |
| --------------- | --------------- | --------------------------------------- |
| Title           | `string`        | `"My Blog Post"`                        |
| Rich Text       | `string`        | `"This is **bold** text"` (as Markdown) |
| Number          | `number`        | `42`                                    |
| Select          | `string`        | `"Published"`                           |
| Multi-select    | `string[]`      | `["tag1", "tag2"]`                      |
| Date            | `Date \| null`  | `new Date("2024-01-15")`                |
| Checkbox        | `boolean`       | `true`                                  |
| URL             | `string`        | `"https://example.com"`                 |
| Email           | `string`        | `"user@example.com"`                    |
| Phone           | `string`        | `"+1-555-123-4567"`                     |
| People          | `string[]`      | `["John Doe", "Jane Smith"]`            |
| Files           | `string[]`      | `["image.jpg", "document.pdf"]`         |
| Relation        | `string[]`      | `["Related Page 1", "Related Page 2"]`  |

## Common Use Cases

### Blog/CMS Content

```typescript
import { NotionCMS, convertRecords } from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

// Fetch published blog posts
const { results: rawPosts } = await cms.getDatabase("blog-database-id")
const posts = await convertRecords(rawPosts, "simple")

posts.forEach((post) => {
  console.log(`${post.Title} - ${post.PublishDate}`)
  console.log(`Tags: ${post.Tags.join(", ")}`)
  console.log(`Published: ${post.Published ? "Yes" : "No"}`)
})
```

### Product Catalog

```typescript
import { NotionCMS, convertRecords } from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

// Get product information
const { results: rawProducts } = await cms.getDatabase("products-database-id")
const products = await convertRecords(rawProducts, "simple")

products.forEach((product) => {
  console.log(`${product.Name} - $${product.Price}`)
  console.log(`Category: ${product.Category}`)
  console.log(`In Stock: ${product.InStock}`)
})
```

### Event Listings

```typescript
import { NotionCMS, convertRecords } from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

const { results: rawEvents } = await cms.getDatabase("events-database-id")
const events = await convertRecords(rawEvents, "simple")

events.forEach((event) => {
  console.log(`${event.Title} - ${event.Date.toLocaleDateString()}`)
  console.log(`Location: ${event.Location}`)
  console.log(`Organizer: ${event.Organizer.join(", ")}`)
})
```

## Working with Dates

```typescript
import {
  NotionCMS,
  convertRecordToSimple,
  convertBlocksToSimple,
  convertBlocksToAdvanced
} from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

const post = results[0]

// Dates are converted to JavaScript Date objects
if (post.PublishDate) {
  console.log("Published on:", post.PublishDate.toLocaleDateString())
  console.log(
    "Days ago:",
    Math.floor(
      (Date.now() - post.PublishDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  )
}
```

## Working with Arrays

```typescript
import {
  NotionCMS,
  convertRecordToSimple,
  convertBlocksToSimple,
  convertBlocksToAdvanced
} from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

const post = results[0]

// Multi-select properties become string arrays
console.log("Tags:", post.Tags.join(", "))
console.log("Number of tags:", post.Tags.length)

// Check if specific value exists
if (post.Tags.includes("typescript")) {
  console.log("This post is about TypeScript!")
}

// People properties are also arrays
console.log("Authors:", post.Authors.join(" & "))
```

## Working with Rich Text

Rich text properties are converted to Markdown strings:

```typescript
import {
  NotionCMS,
  convertRecordToSimple,
  convertBlocksToSimple,
  convertBlocksToAdvanced
} from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

const post = results[0]

// Rich text becomes Markdown
console.log(post.Description)
// Output: "This is **bold** and *italic* text with a [link](https://example.com)"

// You can convert to HTML later if needed
const { results: rawBlocks } = await cms.getPageContentRaw(post.id)
const blocks = await cms.convertBlocksToSimple(rawBlocks)
const html = cms.blocksToHtml(blocks)
```

## Error Handling

```typescript
import {
  NotionCMS,
  convertRecordToSimple,
  convertBlocksToSimple,
  convertBlocksToAdvanced
} from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

try {
  const { results } = await cms.getDatabase("database-id")

  results.forEach((record) => {
    // Always check for null/undefined values
    if (record.Title) {
      console.log(record.Title)
    }

    if (record.PublishDate) {
      console.log("Published:", record.PublishDate.toLocaleDateString())
    }
  })
} catch (error) {
  console.error("Failed to fetch database:", error.message)
}
```

## When to Use Simplified API

✅ **Perfect for:**

- Blog websites and content sites
- Product catalogs and directories
- Event listings and calendars
- Simple data display and templates
- Quick prototyping and development

❌ **Not ideal for:**

- Rich text editors that need formatting details
- UI components that need Notion's color schemes
- Advanced filtering by property metadata
- Recreating Notion's visual appearance

## Moving Beyond Simplified

When you need more than basic data access:

- **[Advanced API](./advanced-api.md)** - Access rich metadata and formatting
- **[Querying & Filtering](./querying-and-filtering.md)** - Build complex queries
- **[Content Parsing](./content-parsing.md)** - Convert rich content to HTML/Markdown

The simplified API gives you clean, JavaScript-friendly data that's perfect for most content use cases. Start here, and move to advanced features only when you need them.
