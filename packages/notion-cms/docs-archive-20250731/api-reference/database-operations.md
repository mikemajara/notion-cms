# Database Operations

This guide covers all database operations available in Notion CMS, including fetching records, pagination, and working with the layered API.

## Overview

Notion CMS provides several methods for working with database records:

- **[`getDatabase()`](#getdatabase)** - Fetch records with pagination support
- **[`getAllDatabaseRecords()`](#getalldatabaserecords)** - Fetch all records with automatic pagination
- **[`getRecord()`](#getrecord)** - Fetch a single record by ID
- **[`query()`](#query)** - Create type-safe query builders (see [Query Builder](./query-builder.md))

All methods return records with the layered API structure, providing Simple, Advanced, and Raw access levels.

## getDatabase()

Fetch records from a Notion database with support for filtering, sorting, and pagination.

### Syntax

```typescript
getDatabase<T extends DatabaseRecord>(
  databaseId: string,
  options?: QueryOptions
): Promise<{ results: T[]; nextCursor: string | null; hasMore: boolean }>
```

### Parameters

| Parameter    | Type           | Required | Description                                          |
| ------------ | -------------- | -------- | ---------------------------------------------------- |
| `databaseId` | `string`       | Yes      | The ID of the Notion database                        |
| `options`    | `QueryOptions` | No       | Query options for filtering, sorting, and pagination |

#### QueryOptions

```typescript
interface QueryOptions {
  filter?: QueryDatabaseParameters["filter"];
  sorts?: QueryDatabaseParameters["sorts"];
  pageSize?: number;
  startCursor?: string;
}
```

| Option        | Type     | Default | Description                          |
| ------------- | -------- | ------- | ------------------------------------ |
| `filter`      | `object` | -       | Notion API filter object             |
| `sorts`       | `array`  | -       | Array of sort configurations         |
| `pageSize`    | `number` | 100     | Number of results per page (max 100) |
| `startCursor` | `string` | -       | Cursor for pagination                |

### Return Value

```typescript
{
  results: T[];           // Array of database records
  nextCursor: string | null;  // Cursor for next page (null if no more pages)
  hasMore: boolean;       // Whether there are more results available
}
```

### Examples

#### Basic Usage

```typescript
const notionCms = new NotionCMS("your-api-key");

// Fetch first page of results
const { results, nextCursor, hasMore } = await notionCms.getDatabase(
  "your-database-id"
);

console.log(`Found ${results.length} records`);
console.log(`Has more pages: ${hasMore}`);

// Access records using layered API
results.forEach((record) => {
  console.log(record.Title); // Simple API
  console.log(record.advanced?.Title); // Advanced API
  console.log(record.raw?.properties?.Title); // Raw API
});
```

#### With Filtering

```typescript
// Using raw Notion API filter format
const { results } = await notionCms.getDatabase("database-id", {
  filter: {
    property: "Status",
    select: {
      equals: "Published",
    },
  },
});
```

#### With Sorting

```typescript
const { results } = await notionCms.getDatabase("database-id", {
  sorts: [
    {
      property: "Created Date",
      direction: "descending",
    },
    {
      property: "Title",
      direction: "ascending",
    },
  ],
});
```

#### With Pagination

```typescript
const { results, nextCursor, hasMore } = await notionCms.getDatabase(
  "database-id",
  { pageSize: 10 }
);

// Fetch next page if available
if (hasMore && nextCursor) {
  const nextPage = await notionCms.getDatabase("database-id", {
    pageSize: 10,
    startCursor: nextCursor,
  });
}
```

## getAllDatabaseRecords()

Fetch all records from a database with automatic pagination. This method handles pagination internally and returns all records in a single array.

### Syntax

```typescript
getAllDatabaseRecords<T extends DatabaseRecord>(
  databaseId: string,
  options?: Omit<QueryOptions, "startCursor" | "pageSize">
): Promise<T[]>
```

### Parameters

| Parameter    | Type           | Required | Description                                     |
| ------------ | -------------- | -------- | ----------------------------------------------- |
| `databaseId` | `string`       | Yes      | The ID of the Notion database                   |
| `options`    | `QueryOptions` | No       | Query options (excluding pagination parameters) |

### Return Value

```typescript
T[] // Array of all database records
```

### Examples

#### Basic Usage

```typescript
// Fetch all records at once
const allRecords = await notionCms.getAllDatabaseRecords("database-id");

console.log(`Total records: ${allRecords.length}`);

// Process all records
allRecords.forEach((record) => {
  console.log(`${record.Title} - ${record.Status}`);
});
```

#### With Filtering

```typescript
// Get all published posts
const publishedPosts = await notionCms.getAllDatabaseRecords("blog-db-id", {
  filter: {
    property: "Status",
    select: { equals: "Published" },
  },
});
```

#### With Sorting

```typescript
// Get all records sorted by creation date
const sortedRecords = await notionCms.getAllDatabaseRecords("database-id", {
  sorts: [
    {
      property: "Created",
      direction: "descending",
    },
  ],
});
```

### Performance Considerations

- **Large Databases**: This method fetches ALL records, which can be slow for large databases
- **Memory Usage**: All records are loaded into memory simultaneously
- **Rate Limits**: Multiple API calls may trigger Notion's rate limits

**Recommendation**: Use `getDatabase()` with pagination for large datasets or when you only need a subset of records.

## getRecord()

Fetch a single record from a database by its page ID.

### Syntax

```typescript
getRecord<T extends DatabaseRecord>(pageId: string): Promise<T>
```

### Parameters

| Parameter | Type     | Required | Description                      |
| --------- | -------- | -------- | -------------------------------- |
| `pageId`  | `string` | Yes      | The ID of the Notion page/record |

### Return Value

```typescript
T; // Single database record with layered API structure
```

### Examples

#### Basic Usage

```typescript
const record = await notionCms.getRecord("page-id");

console.log(record.Title); // Simple API
console.log(record.advanced?.Title); // Advanced API
console.log(record.raw?.properties?.Title); // Raw API
```

#### Error Handling

```typescript
try {
  const record = await notionCms.getRecord("page-id");
  console.log("Record found:", record.Title);
} catch (error) {
  if (error.code === "object_not_found") {
    console.log("Record not found");
  } else {
    console.error("Error fetching record:", error);
  }
}
```

## Layered API Structure

All database operations return records with three levels of access:

### Simple API (Default)

Direct property access with clean JavaScript types:

```typescript
const { results } = await notionCms.getDatabase("database-id");
const record = results[0];

// Clean, simple access
console.log(record.Title); // "My Blog Post"
console.log(record.Tags); // ["react", "typescript"]
console.log(record.PublishDate); // Date object
console.log(record.Priority); // 5
```

### Advanced API

Rich metadata preserved from Notion:

```typescript
// Advanced access provides formatting and metadata
console.log(record.advanced?.Title);
// [{ content: "My Blog Post", annotations: {...}, href: null }]

console.log(record.advanced?.Tags);
// [{ id: "tag1", name: "react", color: "blue" }, ...]
```

### Raw API

Complete unmodified Notion API response:

```typescript
// Raw Notion API data
console.log(record.raw?.properties?.Title);
// Full Notion API property response

console.log(record.raw?.id); // Page ID
console.log(record.raw?.created_time); // ISO timestamp
console.log(record.raw?.url); // Notion page URL
```

## Type Safety

All database operations support TypeScript generics for type safety:

```typescript
// Generate types using the CLI
// npx notion-cms generate --database-id your-id --token your-token

import { BlogPostRecord } from "./generated-types";

// Fully typed database operations
const { results } = await notionCms.getDatabase<BlogPostRecord>("blog-db-id");

// TypeScript knows the shape of your records
const post = results[0];
console.log(post.Title); // TypeScript knows this is a string
console.log(post.Tags); // TypeScript knows this is a string[]
console.log(post.Priority); // TypeScript knows this is a number
```

## Error Handling

Common errors and how to handle them:

### Object Not Found

```typescript
try {
  const record = await notionCms.getRecord("invalid-page-id");
} catch (error) {
  if (error.code === "object_not_found") {
    console.log("Page not found or not accessible");
  }
}
```

### Unauthorized Access

```typescript
try {
  const { results } = await notionCms.getDatabase("database-id");
} catch (error) {
  if (error.code === "unauthorized") {
    console.log("Check your API key and database permissions");
  }
}
```

### Rate Limiting

```typescript
try {
  const allRecords = await notionCms.getAllDatabaseRecords("large-database-id");
} catch (error) {
  if (error.code === "rate_limited") {
    console.log("Rate limited - try again later or use pagination");
  }
}
```

## Best Practices

### 1. Use Pagination for Large Datasets

```typescript
// ❌ Avoid for large databases
const allRecords = await notionCms.getAllDatabaseRecords("large-db");

// ✅ Use pagination instead
const { results, hasMore, nextCursor } = await notionCms.getDatabase(
  "large-db",
  { pageSize: 50 }
);
```

### 2. Filter at the Database Level

```typescript
// ✅ Filter on the server (efficient)
const { results } = await notionCms.getDatabase("database-id", {
  filter: {
    property: "Status",
    select: { equals: "Published" },
  },
});

// ❌ Filter on the client (inefficient)
const { results } = await notionCms.getDatabase("database-id");
const published = results.filter((r) => r.Status === "Published");
```

### 3. Use the Right API Level

```typescript
// ✅ Use Simple API for content
const title = record.Title;
const tags = record.Tags;

// ✅ Use Advanced API for styling
const tagColors = record.advanced?.Tags?.map((tag) => tag.color);

// ✅ Use Raw API for debugging
if (process.env.NODE_ENV === "development") {
  console.log("Raw data:", record.raw);
}
```

### 4. Cache Results When Appropriate

```typescript
// Simple caching example
const cache = new Map();

async function getCachedDatabase(databaseId: string) {
  if (cache.has(databaseId)) {
    return cache.get(databaseId);
  }

  const results = await notionCms.getAllDatabaseRecords(databaseId);
  cache.set(databaseId, results);
  return results;
}
```

## Related Documentation

- **[Query Builder](./query-builder.md)** - Type-safe query building with filters and sorting
- **[Type Generation](./type-generation.md)** - Generate TypeScript types from your databases
- **[Core Concepts](../core-concepts.md)** - Understanding the layered API architecture
