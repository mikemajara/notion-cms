# Migrating from Notion API

This guide helps developers migrate from using the raw Notion API to Notion CMS. We'll cover the differences, provide migration examples, and explain how to leverage Notion CMS's features while maintaining compatibility with existing code.

## Why Migrate to Notion CMS?

### Benefits of Notion CMS

- **Simplified Data Access**: Clean JavaScript types instead of complex nested objects
- **Type Safety**: Built-in TypeScript support with generated types
- **Automatic Pagination**: No need to manually handle cursors
- **Query Builder**: Intuitive, fluent API for building complex queries
- **Layered API**: Access data at different levels of detail
- **Error Handling**: Built-in retry logic and better error messages

### Compatibility

Notion CMS is built on top of the official Notion API, so:

- ✅ All existing database permissions work unchanged
- ✅ API keys and authentication remain the same
- ✅ Raw Notion API responses are still accessible
- ✅ Gradual migration is possible - use both side by side

## Migration Overview

### Before: Raw Notion API

```typescript
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Complex nested object handling
const response = await notion.databases.query({
  database_id: "database-id",
  filter: {
    property: "Status",
    select: {
      equals: "Published",
    },
  },
});

// Manual property extraction
const posts = response.results.map((page) => ({
  id: page.id,
  title: page.properties.Title.title[0]?.plain_text || "",
  status: page.properties.Status.select?.name || "",
  tags: page.properties.Tags.multi_select?.map((tag) => tag.name) || [],
  publishDate: page.properties["Publish Date"].date?.start
    ? new Date(page.properties["Publish Date"].date.start)
    : null,
}));
```

### After: Notion CMS

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS(process.env.NOTION_API_KEY);

// Simple, clean data access
const posts = await notionCms
  .query("database-id")
  .where("Status")
  .equals("Published")
  .execute();

// Direct property access
posts.forEach((post) => {
  console.log(post.Title); // string
  console.log(post.Status); // string
  console.log(post.Tags); // string[]
  console.log(post.PublishDate); // Date | null
});
```

## Step-by-Step Migration Guide

### Step 1: Install Notion CMS

```bash
pnpm add @mikemajara/notion-cms
# Keep existing @notionhq/client for gradual migration
```

### Step 2: Initialize Notion CMS

```typescript
// Add alongside existing Notion client
import { Client } from "@notionhq/client";
import { NotionCMS } from "@mikemajara/notion-cms";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const notionCms = new NotionCMS(process.env.NOTION_API_KEY);
```

### Step 3: Migrate Database Queries

#### Raw API Database Query

```typescript
// Before: Raw Notion API
async function getPublishedPosts() {
  let hasMore = true;
  let startCursor = undefined;
  const allPosts = [];

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: "blog-database-id",
      filter: {
        property: "Status",
        select: { equals: "Published" },
      },
      sorts: [
        {
          property: "Publish Date",
          direction: "descending",
        },
      ],
      start_cursor: startCursor,
      page_size: 50,
    });

    const posts = response.results.map((page) => ({
      id: page.id,
      title: page.properties.Title.title[0]?.plain_text || "",
      content: page.properties.Content.rich_text
        .map((text) => text.plain_text)
        .join(""),
      status: page.properties.Status.select?.name || "",
      tags: page.properties.Tags.multi_select?.map((tag) => tag.name) || [],
      publishDate: page.properties["Publish Date"].date?.start
        ? new Date(page.properties["Publish Date"].date.start)
        : null,
      author:
        page.properties.Author.people
          ?.map((person) => person.name)
          .join(", ") || "",
    }));

    allPosts.push(...posts);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  return allPosts;
}
```

#### Notion CMS Migration

```typescript
// After: Notion CMS
async function getPublishedPosts() {
  // Option 1: Simple approach (recommended)
  return await notionCms
    .query("blog-database-id")
    .where("Status")
    .equals("Published")
    .sort("Publish Date", "descending")
    .all();

  // Option 2: Manual pagination (if needed)
  return await notionCms.getAllDatabaseRecords("blog-database-id", {
    filter: { property: "Status", select: { equals: "Published" } },
    sorts: [{ property: "Publish Date", direction: "descending" }],
  });

  // Data is automatically transformed:
  // posts[0].Title        -> Clean string
  // posts[0].Content      -> Clean string
  // posts[0].Tags         -> string[]
  // posts[0].PublishDate  -> Date | null
  // posts[0].Author       -> string[]
}
```

### Step 4: Migrate Property Access

#### Before: Complex Property Extraction

```typescript
function extractProperties(page) {
  return {
    // Title property
    title: page.properties.Title.title[0]?.plain_text || "",

    // Rich text property
    content: page.properties.Content.rich_text
      .map((text) => text.plain_text)
      .join(""),

    // Select property
    status: page.properties.Status.select?.name || "",

    // Multi-select property
    tags: page.properties.Tags.multi_select?.map((tag) => tag.name) || [],

    // Date property
    publishDate: page.properties["Publish Date"].date?.start
      ? new Date(page.properties["Publish Date"].date.start)
      : null,

    // Number property
    priority: page.properties.Priority.number || 0,

    // Checkbox property
    isPublished: page.properties["Is Published"].checkbox || false,

    // People property
    author: page.properties.Author.people?.map((person) => person.name) || [],

    // URL property
    website: page.properties.Website.url || "",

    // Email property
    email: page.properties.Email.email || "",

    // Phone property
    phone: page.properties.Phone.phone_number || "",
  };
}
```

#### After: Direct Property Access

```typescript
function useNotionCmsRecord(record) {
  // All properties are directly accessible and properly typed
  return {
    title: record.Title, // string
    content: record.Content, // string
    status: record.Status, // string
    tags: record.Tags, // string[]
    publishDate: record.PublishDate, // Date | null
    priority: record.Priority, // number | null
    isPublished: record.IsPublished, // boolean
    author: record.Author, // string[]
    website: record.Website, // string | null
    email: record.Email, // string | null
    phone: record.Phone, // string | null
  };
}
```

### Step 5: Migrate Complex Filters

#### Before: Complex Filter Objects

```typescript
// Complex nested filter
const complexFilter = {
  and: [
    {
      property: "Status",
      select: { equals: "Published" },
    },
    {
      or: [
        {
          property: "Tags",
          multi_select: { contains: "React" },
        },
        {
          property: "Tags",
          multi_select: { contains: "TypeScript" },
        },
      ],
    },
    {
      property: "Publish Date",
      date: {
        on_or_after: "2024-01-01",
      },
    },
  ],
};

const response = await notion.databases.query({
  database_id: "blog-database-id",
  filter: complexFilter,
});
```

#### After: Query Builder

```typescript
// Fluent, readable query builder
const posts = await notionCms
  .query("blog-database-id")
  .where("Status")
  .equals("Published")
  .and((builder) =>
    builder.where("Tags").contains("React").or("Tags").contains("TypeScript")
  )
  .where("Publish Date")
  .onOrAfter(new Date("2024-01-01"))
  .execute();
```

### Step 6: Migrate Pagination

#### Before: Manual Cursor Management

```typescript
async function getAllPages(databaseId) {
  let allResults = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      page_size: 100,
    });

    allResults.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;

    // Rate limiting
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return allResults;
}
```

#### After: Automatic Pagination

```typescript
// Automatic pagination with built-in rate limiting
async function getAllPages(databaseId) {
  return await notionCms.getAllDatabaseRecords(databaseId);
}

// Or with Query Builder
async function getAllPagesWithQuery(databaseId) {
  return await notionCms.query(databaseId).all();
}
```

## Migration Patterns

### Pattern 1: Gradual Migration

Migrate one function at a time while keeping existing code working:

```typescript
class BlogService {
  private notion: Client;
  private notionCms: NotionCMS;

  constructor() {
    this.notion = new Client({ auth: process.env.NOTION_API_KEY });
    this.notionCms = new NotionCMS(process.env.NOTION_API_KEY);
  }

  // Legacy method (to be migrated)
  async getPostsLegacy() {
    const response = await this.notion.databases.query({
      database_id: "blog-db-id",
    });
    return this.transformLegacyResults(response.results);
  }

  // New method using Notion CMS
  async getPosts() {
    return await this.notionCms.getAllDatabaseRecords("blog-db-id");
  }

  // Unified interface during migration
  async getAllPosts(useLegacy = false) {
    return useLegacy ? await this.getPostsLegacy() : await this.getPosts();
  }

  private transformLegacyResults(results) {
    // Legacy transformation logic
    return results.map((page) => ({
      id: page.id,
      title: page.properties.Title.title[0]?.plain_text || "",
      // ... other transformations
    }));
  }
}
```

### Pattern 2: Side-by-Side Comparison

Compare results during migration to ensure accuracy:

```typescript
async function validateMigration(databaseId) {
  console.log("Comparing legacy vs new implementation...");

  // Legacy approach
  const legacyStart = Date.now();
  const legacyResults = await getLegacyData(databaseId);
  const legacyTime = Date.now() - legacyStart;

  // New approach
  const newStart = Date.now();
  const newResults = await notionCms.getAllDatabaseRecords(databaseId);
  const newTime = Date.now() - newStart;

  console.log(`Legacy: ${legacyResults.length} records in ${legacyTime}ms`);
  console.log(`New: ${newResults.length} records in ${newTime}ms`);
  console.log(
    `Performance improvement: ${(
      ((legacyTime - newTime) / legacyTime) *
      100
    ).toFixed(1)}%`
  );

  // Compare specific records
  if (legacyResults.length === newResults.length) {
    console.log("✅ Record count matches");
  } else {
    console.warn("⚠️ Record count mismatch");
  }
}
```

### Pattern 3: Maintaining Raw API Access

Access raw Notion API data when needed:

```typescript
async function hybridApproach(databaseId) {
  const records = await notionCms.getAllDatabaseRecords(databaseId);

  records.forEach((record) => {
    // Use simple API for most operations
    console.log("Title:", record.Title);
    console.log("Status:", record.Status);

    // Access advanced data for complex formatting
    if (record.advanced.Content) {
      const formattedContent = formatRichText(record.advanced.Content);
      console.log("Formatted content:", formattedContent);
    }

    // Access raw API data for debugging or special cases
    if (record.raw.properties.CustomProperty) {
      console.log("Raw custom property:", record.raw.properties.CustomProperty);
    }
  });
}

function formatRichText(richText) {
  return richText
    .map((text) => {
      let formatted = text.plain_text;
      if (text.annotations.bold) formatted = `**${formatted}**`;
      if (text.annotations.italic) formatted = `*${formatted}*`;
      return formatted;
    })
    .join("");
}
```

## Common Migration Challenges

### Challenge 1: Property Name Mapping

**Problem**: Notion property names with spaces become camelCase in Notion CMS.

```typescript
// Notion API
page.properties["Publish Date"].date.start;

// Notion CMS
record.PublishDate; // Space removed, camelCase
```

**Solution**: Use the property mapping guide or inspect the data structure.

```typescript
// Inspect property names
console.log("Available properties:", Object.keys(record));

// Or use the raw data if needed
const publishDate = record.raw.properties["Publish Date"].date?.start;
```

### Challenge 2: Rich Text Formatting

**Problem**: Need to preserve complex rich text formatting.

```typescript
// Before: Manual rich text parsing
const content = page.properties.Content.rich_text
  .map((text) => {
    let formatted = text.plain_text;
    if (text.annotations.bold) formatted = `**${formatted}**`;
    if (text.annotations.italic) formatted = `*${formatted}*`;
    if (text.href) formatted = `[${formatted}](${text.href})`;
    return formatted;
  })
  .join("");
```

**Solution**: Use advanced API for rich formatting, simple API for plain text.

```typescript
// After: Choose the right API level
const plainContent = record.Content; // Simple API - plain text
const richContent = record.advanced.Content; // Advanced API - with formatting

// Or use built-in conversion methods when available
const htmlContent = notionCms.richTextToHtml(record.advanced.Content);
const markdownContent = notionCms.richTextToMarkdown(record.advanced.Content);
```

### Challenge 3: Complex Nested Queries

**Problem**: Very complex filter logic.

**Solution**: Combine Query Builder with raw filters when needed.

```typescript
// Complex filter that might be easier with raw API
const complexFilter = {
  and: [
    { property: "Status", select: { equals: "Published" } },
    {
      or: [
        { property: "Priority", number: { greater_than: 5 } },
        {
          and: [
            { property: "Tags", multi_select: { contains: "Urgent" } },
            { property: "Assignee", people: { is_not_empty: true } },
          ],
        },
      ],
    },
  ],
};

// Use raw filter with Notion CMS
const results = await notionCms.getDatabase("database-id", {
  filter: complexFilter,
});

// Or build it step by step with Query Builder
const results2 = await notionCms
  .query("database-id")
  .where("Status")
  .equals("Published")
  .and((builder) =>
    builder
      .where("Priority")
      .greaterThan(5)
      .or((subBuilder) =>
        subBuilder
          .where("Tags")
          .contains("Urgent")
          .where("Assignee")
          .isNotEmpty()
      )
  )
  .execute();
```

## Type Safety Migration

### Generate Types for Better Development Experience

```bash
# Generate TypeScript types for your databases
npx @mikemajara/notion-cms generate --database-id your-db-id --output-dir ./types
```

```typescript
// Use generated types
import { BlogPost } from "./types/BlogPost";

const posts: BlogPost[] = await notionCms.getAllDatabaseRecords("blog-db-id");

// Full type safety
posts.forEach((post) => {
  console.log(post.Title); // TypeScript knows this is string
  console.log(post.Tags); // TypeScript knows this is string[]
  post.PublishDate?.getTime(); // TypeScript knows this is Date | null
});
```

## Performance Comparison

### Before and After Benchmarks

```typescript
async function performanceComparison(databaseId: string) {
  const iterations = 5;

  // Benchmark legacy approach
  const legacyTimes = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await getLegacyData(databaseId);
    legacyTimes.push(Date.now() - start);
  }

  // Benchmark Notion CMS
  const cmsTimes = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await notionCms.getAllDatabaseRecords(databaseId);
    cmsTimes.push(Date.now() - start);
  }

  const avgLegacy = legacyTimes.reduce((a, b) => a + b) / iterations;
  const avgCms = cmsTimes.reduce((a, b) => a + b) / iterations;

  console.log(`Legacy average: ${avgLegacy.toFixed(2)}ms`);
  console.log(`Notion CMS average: ${avgCms.toFixed(2)}ms`);
  console.log(
    `Improvement: ${(((avgLegacy - avgCms) / avgLegacy) * 100).toFixed(1)}%`
  );
}
```

## Migration Checklist

### Pre-Migration

- [ ] Audit current Notion API usage
- [ ] Identify complex property transformations
- [ ] Document existing filter and sort logic
- [ ] Set up testing environment
- [ ] Install Notion CMS alongside existing code

### During Migration

- [ ] Start with simple database queries
- [ ] Migrate property access patterns
- [ ] Convert filters to Query Builder syntax
- [ ] Update pagination logic
- [ ] Test data transformation accuracy
- [ ] Validate performance improvements

### Post-Migration

- [ ] Remove legacy Notion API dependencies
- [ ] Generate TypeScript types
- [ ] Update documentation
- [ ] Implement error handling patterns
- [ ] Set up monitoring and logging
- [ ] Train team on new API patterns

## Common Gotchas

### 1. Property Name Changes

```typescript
// ❌ This won't work - spaces are removed
record["Publish Date"];

// ✅ Use camelCase
record.PublishDate;

// ✅ Or access via raw data
record.raw.properties["Publish Date"];
```

### 2. Date Handling

```typescript
// ❌ Legacy - manual date parsing
const date = page.properties.Date.date?.start
  ? new Date(page.properties.Date.date.start)
  : null;

// ✅ Notion CMS - automatic Date objects
const date = record.Date; // Already a Date object or null
```

### 3. Array Properties

```typescript
// ❌ Legacy - manual array mapping
const tags = page.properties.Tags.multi_select?.map((tag) => tag.name) || [];

// ✅ Notion CMS - direct array access
const tags = record.Tags; // Already string[]
```

## Need Help?

If you encounter issues during migration:

1. **Check the [Error Handling Guide](./error-handling.md)** for debugging techniques
2. **Review [Working with Properties](./working-with-properties.md)** for property-specific patterns
3. **Use the raw API access** when you need exact Notion API compatibility
4. **Enable debug logging** to compare raw API responses

## Related Documentation

- **[Getting Started](../getting-started.md)** - Quick start guide for new users
- **[Core Concepts](../core-concepts.md)** - Understanding the layered API
- **[Query Builder](../api-reference/query-builder.md)** - Complete query building reference
- **[Database Operations](../api-reference/database-operations.md)** - All database methods
- **[Working with Properties](./working-with-properties.md)** - Property handling patterns
