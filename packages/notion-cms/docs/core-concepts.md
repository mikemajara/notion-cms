# Core Concepts

This guide explains the fundamental concepts behind Notion CMS and how its layered API architecture works.

## The Layered API Architecture

Notion CMS provides a unique **layered API** that gives you access to database records at three different levels of detail:

1. **Simple API** - Clean, JavaScript-friendly types
2. **Advanced API** - Rich metadata preserved from Notion
3. **Raw API** - Complete unmodified Notion API response

This architecture lets you choose the right level of detail for your use case without losing access to the underlying data.

## Simple API (Default)

The Simple API transforms Notion's complex property types into clean JavaScript types that are easy to work with.

### How It Works

```typescript
const { results } = await notionCms.getDatabase(databaseId);
const record = results[0];

// Direct property access - clean and simple
console.log(record.Title); // "My Blog Post" (string)
console.log(record.Tags); // ["react", "typescript"] (string[])
console.log(record.CreatedAt); // Date object
console.log(record.Priority); // 5 (number)
```

### Property Type Conversions

| Notion Property | Simple API Type               | Example                                |
| --------------- | ----------------------------- | -------------------------------------- |
| Title           | `string`                      | `"My Page Title"`                      |
| Rich Text       | `string` (as Markdown)        | `"This is **bold** text"`              |
| Number          | `number`                      | `42`                                   |
| Select          | `string`                      | `"In Progress"`                        |
| Multi-select    | `string[]`                    | `["tag1", "tag2"]`                     |
| Date            | `Date \| null`                | `new Date("2024-01-15")`               |
| Checkbox        | `boolean`                     | `true`                                 |
| URL             | `string`                      | `"https://example.com"`                |
| Email           | `string`                      | `"user@example.com"`                   |
| Phone           | `string`                      | `"+1-555-123-4567"`                    |
| People          | `string[]`                    | `["John Doe", "Jane Smith"]`           |
| Files & Media   | `string[]`                    | `["file1.pdf", "image.jpg"]`           |
| Relation        | `string[]`                    | `["Related Page 1", "Related Page 2"]` |
| Formula         | `string \| number \| boolean` | Depends on formula result              |
| Rollup          | `varies`                      | Depends on rollup property             |

### When to Use Simple API

- **Content websites and blogs** - Clean text and metadata
- **Quick prototyping** - Fast development without complexity
- **Simple integrations** - When you don't need formatting details
- **Data migration** - Converting Notion data to other formats

## Advanced API

The Advanced API preserves rich metadata from Notion properties while still providing a clean interface.

### How It Works

```typescript
const { results } = await notionCms.getDatabase(databaseId);
const record = results[0];

// Simple access still works
console.log(record.Title); // "My Blog Post"

// Advanced access provides more details
console.log(record.advanced.Title);
// [{ content: "My Blog Post", annotations: {...}, href: null }]

console.log(record.advanced.Tags);
// [
//   { id: "abc123", name: "react", color: "blue" },
//   { id: "def456", name: "typescript", color: "orange" }
// ]
```

### Advanced Property Examples

#### Rich Text with Formatting

```typescript
// Simple: Markdown string
record.Description; // "This is **bold** and *italic* text"

// Advanced: Array with formatting details
record.advanced.Description;
// [
//   { content: "This is ", annotations: { bold: false, italic: false } },
//   { content: "bold", annotations: { bold: true, italic: false } },
//   { content: " and ", annotations: { bold: false, italic: false } },
//   { content: "italic", annotations: { bold: false, italic: true } },
//   { content: " text", annotations: { bold: false, italic: false } }
// ]
```

#### Multi-select with Colors

```typescript
// Simple: Array of strings
record.Tags; // ["urgent", "bug-fix"]

// Advanced: Array with metadata
record.advanced.Tags;
// [
//   { id: "tag1", name: "urgent", color: "red" },
//   { id: "tag2", name: "bug-fix", color: "yellow" }
// ]
```

#### People with Details

```typescript
// Simple: Array of names
record.Assignees; // ["John Doe", "Jane Smith"]

// Advanced: Array with user details
record.advanced.Assignees;
// [
//   {
//     id: "user1",
//     name: "John Doe",
//     avatar_url: "https://...",
//     type: "person",
//     person: { email: "john@example.com" }
//   }
// ]
```

### When to Use Advanced API

- **Rich content editors** - Preserving text formatting
- **Design systems** - Using Notion's color schemes
- **User management** - Working with people properties
- **Advanced filtering** - Filtering by property metadata
- **Notion-like UIs** - Recreating Notion's appearance

## Raw API

The Raw API gives you complete access to Notion's unmodified API response.

### How It Works

```typescript
const { results } = await notionCms.getDatabase(databaseId);
const record = results[0];

// Access the raw Notion API response
console.log(record.raw.properties.Title);
// Complete Notion API response for the Title property

console.log(record.raw.properties.Tags.multi_select);
// Raw multi_select property with all Notion metadata
```

### When to Use Raw API

- **Debugging** - Understanding exactly what Notion returns
- **Custom transformations** - Building your own property parsers
- **Integration testing** - Validating API responses
- **Advanced features** - Accessing cutting-edge Notion features

## Choosing the Right API Level

### Decision Matrix

| Use Case      | Recommended API   | Why                                   |
| ------------- | ----------------- | ------------------------------------- |
| Blog/CMS      | Simple            | Clean content, easy templating        |
| Dashboard     | Simple + Advanced | Simple for data, Advanced for styling |
| Rich Editor   | Advanced          | Need formatting preservation          |
| Data Analysis | Simple            | Clean data for processing             |
| Notion Clone  | Advanced + Raw    | Need full fidelity                    |
| Debugging     | Raw               | Need complete information             |

### Mixed Usage Pattern

You can use different API levels for different properties:

```typescript
const record = results[0];

// Use simple for content
const title = record.Title;
const publishDate = record.PublishDate;

// Use advanced for styling information
const priorityColor = record.advanced.Priority?.color;
const tagColors = record.advanced.Tags?.map((tag) => ({
  name: tag.name,
  color: tag.color,
}));

// Use raw for debugging
if (process.env.NODE_ENV === "development") {
  console.log("Raw property data:", record.raw.properties);
}
```

## Type Safety Across Layers

All three API layers maintain full TypeScript support:

```typescript
// Generate types for your database
// Run: npx notion-cms generate --database-id your-id

import { BlogPostRecord } from "./generated-types";

const { results } = await notionCms.getDatabase<BlogPostRecord>(databaseId);

// All layers are typed
const record = results[0];
record.Title; // TypeScript knows this is a string
record.advanced.Tags; // TypeScript knows this is TagOption[]
record.raw.properties.Title; // TypeScript knows the Notion API shape
```

## Performance Considerations

### API Layer Performance

- **Simple API**: Fastest - minimal processing
- **Advanced API**: Moderate - additional parsing and structure
- **Raw API**: Fastest - no processing, direct API response

### Memory Usage

- **Simple API**: Lowest - minimal data structures
- **Advanced API**: Moderate - preserves more metadata
- **Raw API**: Varies - depends on Notion's response size

### Best Practices

1. **Start with Simple** - Use the simple API unless you need advanced features
2. **Selective Advanced Usage** - Use advanced API only for properties that need it
3. **Cache Results** - All API levels support caching for performance
4. **Batch Operations** - Use pagination and batching for large datasets

## Working with the Unified Response

Every response from Notion CMS includes all three API layers:

```typescript
const { results } = await notionCms.getDatabase(databaseId);

results.forEach((record) => {
  // Simple layer (default properties)
  console.log(record.Title);

  // Advanced layer (nested under .advanced)
  console.log(record.advanced?.Title);

  // Raw layer (nested under .raw)
  console.log(record.raw?.properties?.Title);
});
```

This unified approach means you can switch between API layers without changing your data fetching code.

## Next Steps

Now that you understand the core concepts:

- **[Database Operations](./api-reference/database-operations.md)** - Learn about fetching and querying data
- **[Query Builder](./api-reference/query-builder.md)** - Build complex, type-safe queries
- **[Property Types Guide](./guides/working-with-properties.md)** - Deep dive into each property type
- **[Examples](./examples/)** - See real-world usage patterns
