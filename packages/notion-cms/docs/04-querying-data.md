# Querying Data

The Query Builder provides a fluent, type-safe API for querying your Notion databases. Think of it like Prisma's query builder or Drizzle's select API - but for Notion.

## Basic Queries

### Getting All Records

The simplest query fetches all records from a database:

```typescript
const clients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .all()

// Returns: Array of all records
clients.forEach((client) => {
  console.log(client["Client Name"])
})
```

### Getting a Single Record

When you expect exactly one record:

```typescript
// Throws error if no record or multiple records found
const client = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("id", "equals", "some-unique-id")
  .single()

// Returns: Single record or throws error
console.log(client["Client Name"])
```

### Getting Maybe One Record

When you want one record but it might not exist:

```typescript
// Returns: Single record or null
const client = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Email", "equals", "contact@example.com")
  .maybeSingle()

if (client) {
  console.log(client["Client Name"])
}
```

## Filtering

Filters allow you to narrow down results based on property values. The Query Builder provides type-safe filtering with autocomplete.

### Basic Filters

```typescript
// Single filter
const activeClients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Status", "equals", "Active")
  .all()
```

### Multiple Filters

By default, multiple filters are combined with `AND`:

```typescript
// AND logic (default)
const vipActiveClients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Status", "equals", "Active")
  .filter("Tags", "contains", "VIP")
  .all()
// Returns records where Status = "Active" AND Tags contains "VIP"
```

### Available Operators

Operators vary by property type. TypeScript will autocomplete the correct operators for each field:

#### Text Fields (title, rich_text, url, email, phone_number)

- `equals` - Exact match
- `does_not_equal` - Not equal
- `contains` - Contains substring
- `does_not_contain` - Does not contain substring
- `starts_with` - Starts with
- `ends_with` - Ends with
- `is_empty` - Field is empty
- `is_not_empty` - Field has value

```typescript
const clients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Email", "contains", "@example.com")
  .all()
```

#### Number Fields

- `equals` - Equal to
- `does_not_equal` - Not equal to
- `greater_than` - Greater than
- `less_than` - Less than
- `greater_than_or_equal_to` - Greater than or equal
- `less_than_or_equal_to` - Less than or equal
- `is_empty` - Field is empty
- `is_not_empty` - Field has value

```typescript
const highValueDeals = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Deal Value", "greater_than", 10000)
  .all()
```

#### Select & Status Fields

- `equals` - Exact match
- `does_not_equal` - Not equal
- `is_empty` - Field is empty
- `is_not_empty` - Field has value

```typescript
const publishedPosts = await notionCMS
  .query("blogPosts", { recordType: "simple" })
  .filter("Status", "equals", "Published")
  .all()
```

#### Multi-select Fields

- `contains` - Contains option
- `does_not_contain` - Does not contain option
- `is_empty` - Field is empty
- `is_not_empty` - Field has values

```typescript
const reactPosts = await notionCMS
  .query("blogPosts", { recordType: "simple" })
  .filter("Tags", "contains", "react")
  .all()
```

#### Date Fields

- `equals` - Same date
- `before` - Before date
- `after` - After date
- `on_or_before` - On or before date
- `on_or_after` - On or after date
- `is_empty` - Field is empty
- `is_not_empty` - Field has value

```typescript
// Filter by date
const recentClients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Last Contact", "after", new Date("2024-01-01"))
  .all()

// Filter by created time
const newRecords = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .filter("Created", "after", new Date("2024-01-01"))
  .all()
```

#### Checkbox Fields

- `equals` - Checked (true) or unchecked (false)

```typescript
const publishedPosts = await notionCMS
  .query("blogPosts", { recordType: "simple" })
  .filter("Is Published", "equals", true)
  .all()
```

#### Relation Fields

- `contains` - Contains related page ID
- `does_not_contain` - Does not contain related page ID
- `is_empty` - No relations
- `is_not_empty` - Has relations

```typescript
const projectsWithClient = await notionCMS
  .query("eRPDataSourceProjects", { recordType: "simple" })
  .filter("Client", "contains", "some-page-id")
  .all()
```

#### People Fields

- `contains` - Contains user ID
- `does_not_contain` - Does not contain user ID
- `is_empty` - Field is empty
- `is_not_empty` - Field has values

```typescript
const myTasks = await notionCMS
  .query("tasks", { recordType: "simple" })
  .filter("Assigned To", "contains", "user-id-here")
  .all()
```

## Sorting

Sort results by any property:

```typescript
// Single sort
const clients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .sort("Last Contact", "descending")
  .all()

// Multiple sorts (applied in order)
const sortedClients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .sort("Status", "ascending")
  .sort("Last Contact", "descending")
  .all()
// First sorts by Status ascending, then by Last Contact descending
```

### Sort Directions

- `ascending` - A to Z, 0 to 9, oldest to newest
- `descending` - Z to A, 9 to 0, newest to oldest

## Pagination

### Manual Pagination

For large datasets, use pagination to fetch results in chunks:

```typescript
// First page
const firstPage = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .limit(10)
  .execute()

console.log(firstPage.results) // Array of 10 records
console.log(firstPage.hasMore) // true if more pages exist
console.log(firstPage.nextCursor) // Cursor for next page

// Next page
if (firstPage.hasMore && firstPage.nextCursor) {
  const secondPage = await notionCMS
    .query("eRPDataSourceClients", { recordType: "simple" })
    .limit(10)
    .startAfter(firstPage.nextCursor)
    .execute()
}
```

### Automatic Pagination

Use `.all()` to automatically fetch all pages. **Important:** This method recursively fetches all pages until there are no more results:

```typescript
// Fetches all records across all pages automatically
// Internally makes multiple API calls, fetching 100 records at a time (Notion's max)
const allClients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .all()

// Returns: Array of all records (may take time for large datasets)
```

**How it works:**

1. Makes first API call with page size (default: 100, max: 100)
2. If `hasMore` is true, automatically fetches next page using `nextCursor`
3. Repeats until all pages are fetched
4. Returns concatenated array of all results

**Performance considerations:**

- For small datasets (< 100 records): `.all()` is convenient and fast
- For large datasets (1000+ records): Consider using `.execute()` with manual pagination to:
  - Show progress to users
  - Cancel requests if needed
  - Process data incrementally
  - Reduce memory usage

### Limiting Results

Set a maximum number of results per page:

```typescript
const recentClients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .limit(5)
  .sort("Last Contact", "descending")
  .all()
```

**Note:** The default page size is 100. Notion's API maximum is 100 records per page.

## Query Execution Methods

The Query Builder provides several ways to execute queries:

### `.all()` - Fetch All Pages

Automatically paginates through all results:

```typescript
const allRecords = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .all()
// Returns: T[]
```

### `.execute()` - Single Page

Returns one page with pagination metadata:

```typescript
const page = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .limit(10)
  .execute()
// Returns: { results: T[], hasMore: boolean, nextCursor: string | null }
```

### `.single()` - Exactly One Record

Throws error if zero or multiple records:

```typescript
const record = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .filter("id", "equals", "unique-id")
  .single()
// Returns: T (throws if not exactly one)
```

### `.maybeSingle()` - Zero or One Record

Returns null if no record found:

```typescript
const record = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .filter("Email", "equals", "test@example.com")
  .maybeSingle()
// Returns: T | null
```

### `.paginate(pageSize)` - Custom Page Size

Manual pagination with custom page size:

```typescript
const page = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .paginate(20)
// Returns: { results: T[], hasMore: boolean, nextCursor: string | null }
```

## Combining Filters, Sorting, and Pagination

You can chain all query methods together:

```typescript
const results = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Status", "equals", "Active")
  .filter("Tags", "contains", "VIP")
  .sort("Last Contact", "descending")
  .sort("Deal Value", "descending")
  .limit(10)
  .all()
```

## Type Safety

The Query Builder is fully type-safe. TypeScript will:

- ✅ Autocomplete database keys
- ✅ Autocomplete property names
- ✅ Autocomplete valid operators for each property
- ✅ Type-check filter values
- ✅ Autocomplete sort fields

```typescript
// TypeScript knows all available fields
const clients = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .filter("Status", "equals", "Active") // ✅ Autocomplete works
  .filter("InvalidField", "equals", "value") // ❌ TypeScript error
  .all()

// TypeScript knows property types
clients[0]["Client Name"] // ✅ string
clients[0].Tags // ✅ string[]
clients[0]["Deal Value"] // ✅ number
```

## Query Patterns

### Pattern: Recent Records

```typescript
// Get records created in the last 7 days
const recentRecords = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .filter("Created", "after", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  .sort("Created", "descending")
  .all()
```

### Pattern: Search by Multiple Tags

```typescript
// Records that have ANY of these tags
const results = await notionCMS
  .query("blogPosts", { recordType: "simple" })
  .filter("Tags", "contains", "react")
  .all()
// Note: To match ALL tags, use multiple filters (AND logic)
```

### Pattern: Range Queries

```typescript
// Records within a date range
const rangeResults = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .filter("Date", "on_or_after", new Date("2024-01-01"))
  .filter("Date", "on_or_before", new Date("2024-12-31"))
  .all()
```

### Pattern: Empty/Non-empty Checks

```typescript
// Records with empty fields
const incompleteRecords = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .filter("Description", "is_empty")
  .all()

// Records with populated fields
const completeRecords = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .filter("Description", "is_not_empty")
  .all()
```

## Error Handling

Query Builder methods throw errors for invalid operations:

```typescript
try {
  const record = await notionCMS
    .query("myDatabase", { recordType: "simple" })
    .filter("InvalidField", "equals", "value") // ❌ Throws error
    .single()
} catch (error) {
  console.error("Query failed:", error.message)
}

try {
  const record = await notionCMS
    .query("myDatabase", { recordType: "simple" })
    .single() // ❌ Throws if zero or multiple records
} catch (error) {
  if (error.message.includes("No records found")) {
    // Handle no records
  } else if (error.message.includes("Multiple records")) {
    // Handle multiple records
  }
}
```

## Performance Considerations

### When to Use `.all()` vs Pagination

**Use `.all()` when:**

- ✅ Dataset is small (< 100 records)
- ✅ You need all data at once
- ✅ Simple use cases where convenience matters more than performance

**Use `.execute()` with pagination when:**

- ✅ Dataset is large (1000+ records)
- ✅ You want to show progress/loading states
- ✅ You need to process data incrementally
- ✅ Memory usage is a concern
- ✅ You want to allow request cancellation

### Query Optimization Tips

1. **Filter early** - Apply filters before sorting. Notion processes filters server-side efficiently.
2. **Limit results** - Use `.limit()` to cap results per page (max 100 per Notion API limits).
3. **Use indexes** - Notion optimizes queries based on filtered properties automatically.
4. **Batch processing** - For large datasets, process in batches using pagination instead of loading everything at once.

### Default Page Size

The default page size is 100 records (Notion's maximum). When using `.all()`, this means:

- Small dataset (50 records): 1 API call
- Medium dataset (250 records): 3 API calls (100 + 100 + 50)
- Large dataset (5000 records): 50 API calls

Consider your use case and API rate limits when choosing between `.all()` and manual pagination.

## Next Steps

- Learn about **[Content Blocks](./05-content-blocks.md)** - Converting Notion pages to Markdown/HTML
- Explore **[File Management](./06-file-management.md)** - Handling Notion-hosted files
- See **[Real-World Examples](./07-examples.md)** - Complete usage patterns
