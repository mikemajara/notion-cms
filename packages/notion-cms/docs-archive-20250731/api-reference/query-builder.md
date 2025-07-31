# Query Builder

The Query Builder provides a fluent, type-safe API for building complex database queries with filtering, sorting, and pagination. It's the recommended way to query Notion databases when you need advanced filtering capabilities.

## Overview

The Query Builder offers:

- **Type Safety** - Full TypeScript support with field-specific operators
- **Fluent API** - Chainable methods for building complex queries
- **Field-Aware Operations** - Different operators based on field types
- **Automatic Validation** - Validates operators and values at compile time

## Creating a Query Builder

### Basic Syntax

```typescript
notionCms.query<RecordType, FieldMetadata>(databaseId, fieldMetadata?)
```

### Parameters

| Parameter       | Type                    | Required | Description                                         |
| --------------- | ----------------------- | -------- | --------------------------------------------------- |
| `databaseId`    | `string`                | Yes      | The ID of the Notion database                       |
| `fieldMetadata` | `DatabaseFieldMetadata` | No       | Metadata about field types for enhanced type safety |

### Examples

#### Without Field Metadata

```typescript
const query = notionCms.query("database-id");
// Basic query builder without enhanced type safety
```

#### With Field Metadata

```typescript
// Define field metadata for enhanced type safety
const fieldMetadata = {
  Status: {
    type: "select" as const,
    options: ["Draft", "Published", "Archived"] as const,
  },
  Priority: { type: "number" as const },
  Tags: {
    type: "multi_select" as const,
    options: ["react", "typescript", "nodejs"] as const,
  },
  "Publish Date": { type: "date" as const },
} as const;

const query = notionCms.query("database-id", fieldMetadata);
// Enhanced type safety with field-specific operators and values
```

## Filter Methods

### filter() / where()

Add filter conditions to your query. `where()` is an alias for `filter()`.

#### Syntax

```typescript
filter<K extends keyof M & keyof T & string, O extends OperatorsFor<K, M>>(
  property: K,
  operator: O,
  value: ValueTypeFor<K, M, T, O>
): QueryBuilder<T, M>
```

#### Text Field Operators

For `title`, `rich_text`, `url`, `email`, `phone_number` fields:

```typescript
query
  .where("Title")
  .equals("My Blog Post")
  .where("Title")
  .does_not_equal("Draft")
  .where("Title")
  .contains("Blog")
  .where("Title")
  .does_not_contain("Draft")
  .where("Title")
  .starts_with("My")
  .where("Title")
  .ends_with("Post")
  .where("Title")
  .is_empty()
  .where("Title")
  .is_not_empty();
```

#### Number Field Operators

For `number` fields:

```typescript
query
  .where("Priority")
  .equals(5)
  .where("Priority")
  .does_not_equal(1)
  .where("Priority")
  .greater_than(3)
  .where("Priority")
  .less_than(8)
  .where("Priority")
  .greater_than_or_equal_to(4)
  .where("Priority")
  .less_than_or_equal_to(7)
  .where("Priority")
  .is_empty()
  .where("Priority")
  .is_not_empty();
```

#### Select Field Operators

For `select` and `status` fields:

```typescript
query
  .where("Status")
  .equals("Published")
  .where("Status")
  .does_not_equal("Draft")
  .where("Status")
  .is_empty()
  .where("Status")
  .is_not_empty();
```

#### Multi-Select Field Operators

For `multi_select` fields:

```typescript
query
  .where("Tags")
  .contains("react") // Contains any of the specified tags
  .where("Tags")
  .does_not_contain("vue") // Doesn't contain any of the specified tags
  .where("Tags")
  .is_empty()
  .where("Tags")
  .is_not_empty();
```

#### Date Field Operators

For `date`, `created_time`, `last_edited_time` fields:

```typescript
query
  .where("Publish Date")
  .equals(new Date("2024-01-15"))
  .where("Publish Date")
  .before(new Date("2024-12-31"))
  .where("Publish Date")
  .after(new Date("2024-01-01"))
  .where("Publish Date")
  .on_or_before(new Date("2024-12-31"))
  .where("Publish Date")
  .on_or_after(new Date("2024-01-01"))
  .where("Publish Date")
  .is_empty()
  .where("Publish Date")
  .is_not_empty();

// You can also use ISO date strings
query.where("Publish Date").after("2024-01-01");
```

#### Boolean Field Operators

For `checkbox` fields:

```typescript
query.where("Is Featured").equals(true).where("Is Featured").equals(false);
```

#### People and Relation Field Operators

For `people`, `relation`, `created_by`, `last_edited_by` fields:

```typescript
query
  .where("Assignee")
  .contains("user-id") // Contains specific user/relation
  .where("Assignee")
  .does_not_contain("user-id") // Doesn't contain specific user/relation
  .where("Assignee")
  .is_empty()
  .where("Assignee")
  .is_not_empty();
```

## Sorting Methods

### sort()

Add sorting to your query. Multiple sorts are applied in the order they're added.

#### Syntax

```typescript
sort(property: keyof M & keyof T & string, direction?: SortDirection): QueryBuilder<T, M>
```

#### Parameters

| Parameter   | Type                          | Default       | Description              |
| ----------- | ----------------------------- | ------------- | ------------------------ |
| `property`  | `string`                      | -             | Property name to sort by |
| `direction` | `"ascending" \| "descending"` | `"ascending"` | Sort direction           |

#### Examples

```typescript
// Single sort
const results = await notionCms
  .query("database-id")
  .sort("Created Date", "descending")
  .execute();

// Multiple sorts (applied in order)
const results = await notionCms
  .query("database-id")
  .sort("Priority", "descending") // Primary sort
  .sort("Created Date", "ascending") // Secondary sort
  .execute();
```

## Pagination Methods

### limit()

Limit the number of results returned.

```typescript
limit(limit: number): QueryBuilder<T, M>
```

#### Example

```typescript
const results = await notionCms.query("database-id").limit(10).execute();
```

### startAfter()

Start results after a specific cursor (for pagination).

```typescript
startAfter(cursor: string): QueryBuilder<T, M>
```

#### Example

```typescript
// First page
const firstPage = await notionCms.query("database-id").limit(10).paginate();

// Next page
if (firstPage.hasMore && firstPage.nextCursor) {
  const secondPage = await notionCms
    .query("database-id")
    .limit(10)
    .startAfter(firstPage.nextCursor)
    .paginate();
}
```

### paginate()

Execute query with pagination metadata.

```typescript
paginate(pageSize?: number): Promise<QueryResult<T>>
```

#### Return Value

```typescript
interface QueryResult<T> {
  results: T[];
  hasMore: boolean;
  nextCursor: string | null;
}
```

#### Example

```typescript
const { results, hasMore, nextCursor } = await notionCms
  .query("database-id")
  .where("Status")
  .equals("Published")
  .paginate(20);

console.log(`Found ${results.length} results`);
console.log(`Has more: ${hasMore}`);
```

## Execution Methods

### execute()

Execute the query and return results as an array.

```typescript
execute(): Promise<T[]>
```

#### Example

```typescript
const results = await notionCms
  .query("database-id")
  .where("Status")
  .equals("Published")
  .sort("Created Date", "descending")
  .execute();

results.forEach((post) => {
  console.log(post.Title);
});
```

### all()

Execute the query with automatic pagination to fetch all matching results.

```typescript
all(): Promise<T[]>
```

#### Example

```typescript
// Fetch all published posts (handles pagination automatically)
const allPosts = await notionCms
  .query("database-id")
  .where("Status")
  .equals("Published")
  .all();

console.log(`Total published posts: ${allPosts.length}`);
```

### single()

Execute the query expecting exactly one result. Throws an error if zero or multiple results are found.

```typescript
single(): Promise<T>
```

#### Example

```typescript
try {
  const featuredPost = await notionCms
    .query("database-id")
    .where("Is Featured")
    .equals(true)
    .single();

  console.log("Featured post:", featuredPost.Title);
} catch (error) {
  console.error("Expected exactly one featured post");
}
```

### maybeSingle()

Execute the query expecting zero or one result. Returns `null` if no results found.

```typescript
maybeSingle(): Promise<T | null>
```

#### Example

```typescript
const featuredPost = await notionCms
  .query("database-id")
  .where("Is Featured")
  .equals(true)
  .maybeSingle();

if (featuredPost) {
  console.log("Featured post:", featuredPost.Title);
} else {
  console.log("No featured post found");
}
```

## Promise Interface

Query builders implement the Promise interface, so you can `await` them directly:

```typescript
// These are equivalent:
const results1 = await notionCms.query("database-id").execute();
const results2 = await notionCms.query("database-id");
```

## Complex Query Examples

### Multiple Filters with AND Logic

```typescript
const results = await notionCms
  .query("database-id")
  .where("Status")
  .equals("Published")
  .where("Priority")
  .greater_than(3)
  .where("Tags")
  .contains("important")
  .execute();
// All conditions must be true (AND logic)
```

### Date Range Filtering

```typescript
const recentPosts = await notionCms
  .query("blog-database-id")
  .where("Publish Date")
  .after("2024-01-01")
  .where("Publish Date")
  .before("2024-12-31")
  .sort("Publish Date", "descending")
  .execute();
```

### Complex Sorting

```typescript
const sortedTasks = await notionCms
  .query("tasks-database-id")
  .where("Status")
  .does_not_equal("Completed")
  .sort("Priority", "descending") // High priority first
  .sort("Due Date", "ascending") // Then by due date
  .sort("Title", "ascending") // Finally by title
  .execute();
```

### Pagination Pattern

```typescript
async function fetchAllPages<T>(
  query: QueryBuilder<T, any>,
  pageSize: number = 50
): Promise<T[]> {
  const allResults: T[] = [];
  let hasMore = true;
  let cursor: string | null = null;

  while (hasMore) {
    const queryWithCursor = cursor ? query.startAfter(cursor) : query;

    const {
      results,
      hasMore: more,
      nextCursor,
    } = await queryWithCursor.limit(pageSize).paginate();

    allResults.push(...results);
    hasMore = more;
    cursor = nextCursor;
  }

  return allResults;
}

// Usage
const allPublishedPosts = await fetchAllPages(
  notionCms.query("blog-db").where("Status").equals("Published"),
  25
);
```

## Type Safety Features

### Field Metadata for Enhanced Type Safety

```typescript
const fieldMetadata = {
  Status: {
    type: "select" as const,
    options: ["Draft", "In Review", "Published"] as const,
  },
  Priority: { type: "number" as const },
  Tags: {
    type: "multi_select" as const,
    options: ["react", "typescript", "nodejs", "css"] as const,
  },
} as const;

const query = notionCms.query("database-id", fieldMetadata);

// TypeScript will enforce valid operators and values
query.where("Status").equals("Published"); // ✅ Valid
query.where("Status").equals("InvalidStatus"); // ❌ TypeScript error
query.where("Priority").greater_than(5); // ✅ Valid
query.where("Priority").contains("text"); // ❌ TypeScript error
```

### Generated Types Integration

```typescript
// Generate types with the CLI
// npx notion-cms generate --database-id your-id --token your-token

import { BlogPostRecord, BlogFieldMetadata } from "./generated-types";

// Fully typed query with generated metadata
const typedQuery = notionCms.query<BlogPostRecord, BlogFieldMetadata>(
  "blog-database-id",
  blogFieldMetadata // Auto-generated field metadata
);

// Full type safety for all operations
const posts = await typedQuery
  .where("Status")
  .equals("Published") // Status options from your database
  .where("Tags")
  .contains("react") // Tag options from your database
  .sort("Publish Date", "descending")
  .execute();
```

## Error Handling

### Query Validation Errors

```typescript
try {
  const results = await notionCms
    .query("database-id")
    .where("NonExistentField")
    .equals("value") // Invalid field
    .execute();
} catch (error) {
  console.error("Query validation error:", error.message);
}
```

### Execution Errors

```typescript
try {
  const result = await notionCms
    .query("database-id")
    .where("Status")
    .equals("Published")
    .single(); // Expecting exactly one result
} catch (error) {
  if (error.message.includes("Expected exactly one")) {
    console.error("Multiple or no results found");
  }
}
```

## Best Practices

### 1. Use Field Metadata for Type Safety

```typescript
// ✅ Define field metadata for better developer experience
const fieldMetadata = {
  Status: { type: "select" as const, options: ["Draft", "Published"] as const },
  Priority: { type: "number" as const },
} as const;

const query = notionCms.query("db-id", fieldMetadata);
```

### 2. Use Specific Execution Methods

```typescript
// ✅ Use specific methods based on expected results
const allPosts = await query.all(); // For all results
const firstPost = await query.maybeSingle(); // For 0 or 1 result
const featuredPost = await query.single(); // For exactly 1 result
```

### 3. Combine Filters Effectively

```typescript
// ✅ Combine filters to reduce result set on the server
const recentImportantPosts = await notionCms
  .query("database-id")
  .where("Status")
  .equals("Published")
  .where("Priority")
  .greater_than(7)
  .where("Publish Date")
  .after("2024-01-01")
  .limit(10)
  .execute();
```

### 4. Handle Pagination for Large Datasets

```typescript
// ✅ Use pagination for large result sets
const { results, hasMore, nextCursor } = await notionCms
  .query("large-database-id")
  .where("Status")
  .equals("Published")
  .paginate(50);
```

## Related Documentation

- **[Database Operations](./database-operations.md)** - Basic database CRUD operations
- **[Type Generation](./type-generation.md)** - Generate TypeScript types and field metadata
- **[Core Concepts](../core-concepts.md)** - Understanding the layered API architecture
