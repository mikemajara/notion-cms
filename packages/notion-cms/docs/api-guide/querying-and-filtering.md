---
title: "Querying and Filtering"
description: "Master the query builder for filtering, sorting, and paginating your Notion data."
date: "2024-01-20"
---

# Querying and Filtering

Build type-safe queries to find and sort your Notion content. The query builder provides a fluent API for filtering, sorting, and pagination.

## Basic Querying

```typescript
import { NotionCMS } from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")

// Simple query - get all records
const { results } = await cms.getDatabase("database-id")

// Query builder - filter and sort
const posts = await cms
  .query("database-id")
  .filter("Status", "equals", "Published")
  .sort("Date", "descending")
  .all()
```

## Type-Safe Queries with Generated Types

Generate TypeScript types for full autocomplete and type safety:

```bash
# Generate types for your database
npx @mikemajara/notion-cms generate -t YOUR_API_KEY -d YOUR_DATABASE_ID
```

Then use with full type safety:

```typescript
import { BlogPostRecord } from "./generated-types"

// Full type safety and autocomplete
const query = cms.query<BlogPostRecord>("blog-database-id")

const publishedPosts = await query
  .filter("Status", "equals", "Published") // ✅ TypeScript knows "Status" exists
  .filter("Tags", "contains", "typescript") // ✅ TypeScript knows "Tags" is array
  .sort("PublishDate", "descending") // ✅ TypeScript knows "PublishDate" exists
  .all()

// Results are fully typed
publishedPosts.forEach((post) => {
  console.log(post.Title) // ✅ TypeScript knows this is string
  console.log(post.Tags) // ✅ TypeScript knows this is string[]
  console.log(post.PublishDate) // ✅ TypeScript knows this is Date
})
```

## Filtering

### Text Properties

```typescript
// Title and Rich Text
await cms.query("database-id").filter("Title", "equals", "My Post").all()

await cms.query("database-id").filter("Title", "contains", "TypeScript").all()

await cms
  .query("database-id")
  .filter("Description", "starts_with", "Introduction")
  .all()
```

### Select Properties

```typescript
// Single select
await cms.query("database-id").filter("Status", "equals", "Published").all()

// Multi-select
await cms.query("database-id").filter("Tags", "contains", "react").all()

await cms
  .query("database-id")
  .filter("Tags", "does_not_contain", "deprecated")
  .all()
```

### Number Properties

```typescript
await cms.query("database-id").filter("Price", "equals", 99).all()

await cms.query("database-id").filter("Score", "greater_than", 80).all()

await cms.query("database-id").filter("Discount", "less_than_or_equal_to", 20).all()
```

### Date Properties

```typescript
// Specific date
await cms
  .query("database-id")
  .filter("PublishDate", "equals", new Date("2024-01-15"))
  .all()

// Date ranges
await cms
  .query("database-id")
  .filter("PublishDate", "after", new Date("2024-01-01"))
  .all()

await cms
  .query("database-id")
  .filter("CreatedAt", "on_or_after", new Date("2024-01-01"))
  .filter("CreatedAt", "before", new Date("2024-12-31"))
  .all()

// Note: Period helpers like thisWeek() are not available in current API
// Use specific date ranges instead
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
await cms.query("database-id").filter("PublishDate", "on_or_after", weekAgo).all()
```

### Checkbox Properties

```typescript
await cms.query("database-id").filter("Published", "equals", true).all()

await cms.query("database-id").filter("Featured", "equals", false).all()
```

### Empty/Not Empty

```typescript
// Check for empty values
await cms.query("database-id").filter("Description", "is_empty", true).all()

// Check for non-empty values
await cms.query("database-id").filter("Tags", "is_not_empty", true).all()
```

## Combining Filters

### AND Logic (default)

```typescript
// All conditions must be true
const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
await cms
  .query("database-id")
  .filter("Status", "equals", "Published")
  .filter("Tags", "contains", "typescript")
  .filter("PublishDate", "on_or_after", monthAgo)
  .all()
```

### OR Logic

```typescript
// Complex OR logic requires raw Notion filters
// Use getDatabase with custom filter for OR conditions
const { results } = await cms.getDatabase("database-id", {
  filter: {
    or: [
      { property: "Status", select: { equals: "Published" } },
      { property: "Status", select: { equals: "Featured" } }
    ]
  }
})
```

### Complex Logic

```typescript
// Complex logic requires raw Notion filters
const { results } = await cms.getDatabase("database-id", {
  filter: {
    and: [
      {
        or: [
          { property: "Status", select: { equals: "Published" } },
          { property: "Status", select: { equals: "Featured" } }
        ]
      },
      { property: "Tags", multi_select: { contains: "typescript" } }
    ]
  }
})
```

## Sorting

### Single Sort

```typescript
// Sort by date, newest first
await cms.query("database-id").sort("PublishDate", "descending").all()

// Sort by title alphabetically
await cms.query("database-id").sort("Title", "ascending").all()
```

### Multiple Sorts

```typescript
// Sort by status first, then by date
await cms
  .query("database-id")
  .sort("Status", "ascending")
  .sort("PublishDate", "descending")
  .all()
```

### Sort by System Properties

```typescript
// Sort by creation date
await cms.query("database-id").sort("created_time", "descending").all()

// Sort by last edit
await cms.query("database-id").sort("last_edited_time", "descending").all()
```

## Pagination

### Basic Pagination

```typescript
// Get first 10 results
const page1 = await cms.query("database-id").limit(10).paginate(10)

console.log(`Found ${page1.results.length} results`)
console.log(`Has more: ${page1.hasMore}`)

// Get next page
if (page1.hasMore) {
  const page2 = await cms
    .query("database-id")
    .limit(10)
    .startAfter(page1.nextCursor)
    .paginate(10)
}
```

### Pagination Loop

```typescript
async function getAllResults(databaseId: string) {
  const allResults = []
  let cursor = null

  do {
    const page = await cms
      .query(databaseId)
      .limit(100)
      .startAfter(cursor)
      .paginate(100)

    allResults.push(...page.results)
    cursor = page.nextCursor
  } while (cursor)

  return allResults
}
```

## Common Query Patterns

### Published Blog Posts

```typescript
const publishedPosts = await cms
  .query("blog-database-id")
  .filter("Status", "equals", "Published")
  .filter("PublishDate", "on_or_before", new Date()) // Not future-dated
  .sort("PublishDate", "descending")
  .all()
```

### Featured Products

```typescript
const featuredProducts = await cms
  .query("products-database-id")
  .filter("Featured", "equals", true)
  .filter("InStock", "equals", true)
  .filter("Price", "greater_than", 0)
  .sort("Rating", "descending")
  .all()
```

### Recent Updates

```typescript
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
const recentlyUpdated = await cms
  .query("database-id")
  .filter("last_edited_time", "on_or_after", weekAgo)
  .sort("last_edited_time", "descending")
  .all()
```

### Search Functionality

```typescript
async function searchContent(query: string) {
  // Complex OR searches require raw Notion filters
  const { results } = await cms.getDatabase("database-id", {
    filter: {
      or: [
        { property: "Title", title: { contains: query } },
        { property: "Description", rich_text: { contains: query } },
        { property: "Tags", multi_select: { contains: query } }
      ]
    },
    sorts: [{ property: "last_edited_time", direction: "descending" }]
  })
  return results
}
```

### Tag-Based Filtering

```typescript
async function getPostsByTag(tag: string) {
  return await cms
    .query("blog-database-id")
    .filter("Status", "equals", "Published")
    .filter("Tags", "contains", tag)
    .sort("PublishDate", "descending")
    .all()
}
```

## Performance Tips

### Use Filters Early

```typescript
// ✅ Good - filter on server
const results = await cms
  .query("database-id")
  .filter("Status", "equals", "Published")
  .all()

// ❌ Avoid - filter on client
const { results } = await cms.getDatabase("database-id")
const published = results.filter((r) => r.Status === "Published")
```

### Limit Results When Possible

```typescript
// ✅ Good - only get what you need
const latest = await cms
  .query("database-id")
  .sort("PublishDate", "descending")
  .limit(5)
  .all()

// ❌ Avoid - getting all records when you only need a few
const all = await cms.getAllDatabaseRecords("database-id")
const latest = all.slice(0, 5)
```

### Index Your Filters

Structure your Notion database with filters in mind:

- Put commonly filtered properties first
- Use select properties instead of text when possible
- Consider date properties for time-based queries

## Error Handling

```typescript
try {
  const results = await cms
    .query("database-id")
    .filter("Status", "equals", "Published")
    .all()

  return results
} catch (error) {
  if (error.message.includes("property")) {
    console.error("Invalid property name in query")
  } else if (error.message.includes("operator")) {
    console.error("Invalid operator for property type")
  } else {
    console.error("Query failed:", error.message)
  }

  return []
}
```

## Next Steps

- **[Type Generation](./type-generation.md)** - Generate TypeScript types for better development
- **[Content Parsing](./content-parsing.md)** - Convert query results to HTML/Markdown
- **[Simplified API](./simplified-api.md)** - Understand the data structure returned by queries
