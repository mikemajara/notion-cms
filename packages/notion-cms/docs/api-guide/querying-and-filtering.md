# Querying and Filtering

Build type-safe queries to find and sort your Notion content. The query builder provides a fluent API for filtering, sorting, and pagination.

## Basic Querying

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const cms = new NotionCMS("your-notion-api-key");

// Simple query - get all records
const { results } = await cms.getDatabase("database-id");

// Query builder - filter and sort
const posts = await cms.query("database-id")
  .where("Status").equals("Published")
  .sort("Date", "desc")
  .execute();
```

## Type-Safe Queries with Generated Types

Generate TypeScript types for full autocomplete and type safety:

```bash
# Generate types for your database
npx @mikemajara/notion-cms generate -t YOUR_API_KEY -d YOUR_DATABASE_ID
```

Then use with full type safety:

```typescript
import { BlogPostRecord } from "./generated-types";

// Full type safety and autocomplete
const query = cms.query<BlogPostRecord>("blog-database-id");

const publishedPosts = await query
  .where("Status").equals("Published")  // ✅ TypeScript knows "Status" exists
  .where("Tags").contains("typescript") // ✅ TypeScript knows "Tags" is array
  .sort("PublishDate", "desc")          // ✅ TypeScript knows "PublishDate" exists
  .execute();

// Results are fully typed
publishedPosts.forEach(post => {
  console.log(post.Title);      // ✅ TypeScript knows this is string
  console.log(post.Tags);       // ✅ TypeScript knows this is string[]
  console.log(post.PublishDate); // ✅ TypeScript knows this is Date
});
```

## Filtering

### Text Properties

```typescript
// Title and Rich Text
await cms.query("database-id")
  .where("Title").equals("My Post")
  .execute();

await cms.query("database-id")
  .where("Title").contains("TypeScript")
  .execute();

await cms.query("database-id")
  .where("Description").startsWith("Introduction")
  .execute();
```

### Select Properties

```typescript
// Single select
await cms.query("database-id")
  .where("Status").equals("Published")
  .execute();

// Multi-select
await cms.query("database-id")
  .where("Tags").contains("react")
  .execute();

await cms.query("database-id")
  .where("Tags").doesNotContain("deprecated")
  .execute();
```

### Number Properties

```typescript
await cms.query("database-id")
  .where("Price").equals(99)
  .execute();

await cms.query("database-id")
  .where("Score").greaterThan(80)
  .execute();

await cms.query("database-id")
  .where("Discount").lessThanOrEqual(20)
  .execute();
```

### Date Properties

```typescript
// Specific date
await cms.query("database-id")
  .where("PublishDate").equals(new Date("2024-01-15"))
  .execute();

// Date ranges
await cms.query("database-id")
  .where("PublishDate").after(new Date("2024-01-01"))
  .execute();

await cms.query("database-id")
  .where("CreatedAt").onOrAfter(new Date("2024-01-01"))
  .where("CreatedAt").before(new Date("2024-12-31"))
  .execute();

// This week, month, year
await cms.query("database-id")
  .where("PublishDate").thisWeek()
  .execute();

await cms.query("database-id")
  .where("PublishDate").thisMonth()
  .execute();
```

### Checkbox Properties

```typescript
await cms.query("database-id")
  .where("Published").equals(true)
  .execute();

await cms.query("database-id")
  .where("Featured").equals(false)
  .execute();
```

### Empty/Not Empty

```typescript
// Check for empty values
await cms.query("database-id")
  .where("Description").isEmpty()
  .execute();

// Check for non-empty values
await cms.query("database-id")
  .where("Tags").isNotEmpty()
  .execute();
```

## Combining Filters

### AND Logic (default)

```typescript
// All conditions must be true
await cms.query("database-id")
  .where("Status").equals("Published")
  .where("Tags").contains("typescript")
  .where("PublishDate").thisMonth()
  .execute();
```

### OR Logic

```typescript
// Any condition can be true
await cms.query("database-id")
  .where("Status").equals("Published")
  .or()
  .where("Status").equals("Featured")
  .execute();
```

### Complex Logic

```typescript
// (Status = Published OR Featured) AND Tags contains typescript
await cms.query("database-id")
  .where("Status").equals("Published")
  .or()
  .where("Status").equals("Featured")
  .and()
  .where("Tags").contains("typescript")
  .execute();
```

## Sorting

### Single Sort

```typescript
// Sort by date, newest first
await cms.query("database-id")
  .sort("PublishDate", "desc")
  .execute();

// Sort by title alphabetically
await cms.query("database-id")
  .sort("Title", "asc")
  .execute();
```

### Multiple Sorts

```typescript
// Sort by status first, then by date
await cms.query("database-id")
  .sort("Status", "asc")
  .sort("PublishDate", "desc")
  .execute();
```

### Sort by System Properties

```typescript
// Sort by creation date
await cms.query("database-id")
  .sort("created_time", "desc")
  .execute();

// Sort by last edit
await cms.query("database-id")
  .sort("last_edited_time", "desc")
  .execute();
```

## Pagination

### Basic Pagination

```typescript
// Get first 10 results
const page1 = await cms.query("database-id")
  .limit(10)
  .execute();

console.log(`Found ${page1.results.length} results`);
console.log(`Has more: ${page1.hasMore}`);

// Get next page
if (page1.hasMore) {
  const page2 = await cms.query("database-id")
    .limit(10)
    .startCursor(page1.nextCursor)
    .execute();
}
```

### Pagination Loop

```typescript
async function getAllResults(databaseId: string) {
  const allResults = [];
  let cursor = null;
  
  do {
    const page = await cms.query(databaseId)
      .limit(100)
      .startCursor(cursor)
      .execute();
    
    allResults.push(...page.results);
    cursor = page.nextCursor;
  } while (cursor);
  
  return allResults;
}
```

## Common Query Patterns

### Published Blog Posts

```typescript
const publishedPosts = await cms.query("blog-database-id")
  .where("Status").equals("Published")
  .where("PublishDate").onOrBefore(new Date()) // Not future-dated
  .sort("PublishDate", "desc")
  .execute();
```

### Featured Products

```typescript
const featuredProducts = await cms.query("products-database-id")
  .where("Featured").equals(true)
  .where("InStock").equals(true)
  .where("Price").greaterThan(0)
  .sort("Rating", "desc")
  .execute();
```

### Recent Updates

```typescript
const recentlyUpdated = await cms.query("database-id")
  .where("last_edited_time").pastWeek()
  .sort("last_edited_time", "desc")
  .execute();
```

### Search Functionality

```typescript
async function searchContent(query: string) {
  return await cms.query("database-id")
    .where("Title").contains(query)
    .or()
    .where("Description").contains(query)
    .or()
    .where("Tags").contains(query)
    .sort("last_edited_time", "desc")
    .execute();
}
```

### Tag-Based Filtering

```typescript
async function getPostsByTag(tag: string) {
  return await cms.query("blog-database-id")
    .where("Status").equals("Published")
    .where("Tags").contains(tag)
    .sort("PublishDate", "desc")
    .execute();
}
```

## Performance Tips

### Use Filters Early

```typescript
// ✅ Good - filter on server
const results = await cms.query("database-id")
  .where("Status").equals("Published")
  .execute();

// ❌ Avoid - filter on client
const { results } = await cms.getDatabase("database-id");
const published = results.filter(r => r.Status === "Published");
```

### Limit Results When Possible

```typescript
// ✅ Good - only get what you need
const latest = await cms.query("database-id")
  .sort("PublishDate", "desc")
  .limit(5)
  .execute();

// ❌ Avoid - getting all records when you only need a few
const all = await cms.getAllDatabaseRecords("database-id");
const latest = all.slice(0, 5);
```

### Index Your Filters

Structure your Notion database with filters in mind:
- Put commonly filtered properties first
- Use select properties instead of text when possible
- Consider date properties for time-based queries

## Error Handling

```typescript
try {
  const results = await cms.query("database-id")
    .where("Status").equals("Published")
    .execute();
  
  return results;
} catch (error) {
  if (error.message.includes("property")) {
    console.error("Invalid property name in query");
  } else if (error.message.includes("operator")) {
    console.error("Invalid operator for property type");
  } else {
    console.error("Query failed:", error.message);
  }
  
  return { results: [], hasMore: false, nextCursor: null };
}
```

## Next Steps

- **[Type Generation](./type-generation.md)** - Generate TypeScript types for better development
- **[Content Parsing](./content-parsing.md)** - Convert query results to HTML/Markdown
- **[Simplified API](./simplified-api.md)** - Understand the data structure returned by queries