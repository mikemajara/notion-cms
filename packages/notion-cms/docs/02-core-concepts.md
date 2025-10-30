# Core Concepts

Understanding the three-layer API architecture is key to using Notion CMS effectively. This guide explains how data flows through the library and when to use each layer.

## The Three-Layer API

Notion CMS provides three ways to access your data, each optimized for different use cases:

1. **Simple Layer** - Clean JavaScript types, perfect for most use cases
2. **Advanced Layer** - Rich metadata preserved, when you need colors, IDs, and structured data
3. **Raw Layer** - Complete Notion API response, for debugging and advanced use

Think of it like SQL ORMs: Simple is like selecting specific columns, Advanced is like getting relations with metadata, and Raw is the full database row.

## Simple Layer

The Simple layer converts Notion properties into clean JavaScript types. This is the default layer for most queries.

### What You Get

- **Title/Rich Text** → `string`
- **Number** → `number`
- **Select** → `string` (option name)
- **Multi-select** → `string[]` (array of option names)
- **Date** → `Date` object
- **Checkbox** → `boolean`
- **People** → `string[]` (array of names)
- **Files** → `Array<{ name: string, url: string }>`
- **Relation** → `string[]` (array of related page IDs)
- **URL/Email/Phone** → `string`

### Example

```typescript
const records = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .all()

const record = records[0]

// Clean, simple access
console.log(record.Title) // "My Blog Post"
console.log(record.Tags) // ["react", "typescript"]
console.log(record.PublishDate) // Date object
console.log(record.IsPublished) // true
```

### When to Use Simple Layer

- ✅ Building UI components that display data
- ✅ Most common use cases (90% of scenarios)
- ✅ When you just need the values, not metadata
- ✅ Working with forms and data processing

## Advanced Layer

The Advanced layer preserves rich metadata from Notion, including colors, IDs, and structured information.

### What You Get

- **Title/Rich Text** → `Array<{ content: string, annotations: {...}, href: string | null }>`
- **Select** → `{ id: string, name: string, color: string } | null`
- **Multi-select** → `Array<{ id: string, name: string, color: string }>`
- **Date** → `{ start: string, end: string | null, time_zone: string | null, parsedStart: Date | null, parsedEnd: Date | null }`
- **People** → `Array<{ id: string, name: string, avatar_url: string, email?: string }>`
- **Status** → `{ id: string, name: string, color: string } | null`
- **Files** → `Array<{ name: string, type: string, external?: {...}, file?: {...} }>`

### Example

```typescript
const records = await notionCMS
  .query("myDatabase", { recordType: "advanced" })
  .all()

const record = records[0]

// Rich metadata access
console.log(record.Tags)
// [
//   { id: "tag1", name: "react", color: "blue" },
//   { id: "tag2", name: "typescript", color: "green" }
// ]

console.log(record.Status)
// { id: "status1", name: "Published", color: "green" }

console.log(record.Author)
// [
//   { id: "user1", name: "John Doe", email: "john@example.com", avatar_url: "..." }
// ]
```

### When to Use Advanced Layer

- ✅ Building UI that needs to show tag colors
- ✅ Displaying user avatars and details
- ✅ Implementing status indicators with colors
- ✅ Accessing rich text formatting information
- ✅ Working with date ranges and time zones

## Raw Layer

The Raw layer provides the complete Notion API response, giving you full access to everything Notion returns.

### What You Get

The complete `PageObjectResponse` from `@notionhq/client`, including:

- Full property structures
- All metadata
- Complete block hierarchies
- Everything Notion's API provides

### Example

```typescript
const records = await notionCMS.query("myDatabase", { recordType: "raw" }).all()

const record = records[0]

// Full Notion API access
console.log(record.properties.Title)
// Complete Notion title property structure

console.log(record.created_time)
console.log(record.last_edited_time)
console.log(record.archived)
// All page metadata
```

### When to Use Raw Layer

- ✅ Debugging data issues
- ✅ Accessing properties not yet supported in Simple/Advanced
- ✅ Building advanced integrations
- ✅ When you need the exact Notion API structure
- ✅ Working with unsupported property types

## Choosing the Right Layer

### Decision Tree

```
Do you need metadata (colors, IDs, avatars)?
├─ Yes → Use Advanced Layer
└─ No → Continue
    │
    Do you need anything beyond basic values?
    ├─ Yes → Use Raw Layer
    └─ No → Use Simple Layer (recommended)
```

### Performance Considerations

- **Simple Layer**: Fastest, smallest data footprint
- **Advanced Layer**: Slightly more data, preserves structure
- **Raw Layer**: Largest payload, complete API response

For most applications, start with Simple and upgrade to Advanced only when you need metadata.

## Converting Between Layers

You can convert records between layers using helper functions:

```typescript
import {
  convertRecordToSimple,
  convertRecordToAdvanced
} from "@mikemajara/notion-cms"

// Start with raw
const rawRecords = await notionCMS
  .query("myDatabase", { recordType: "raw" })
  .all()

// Convert to simple when needed
const simpleRecord = await convertRecordToSimple(rawRecords[0])

// Convert to advanced when needed
const advancedRecord = await convertRecordToAdvanced(rawRecords[0])
```

## Database Record Structure

All records across all layers include:

```typescript
{
  id: string // Notion page ID
  // ... properties based on layer
}
```

The `id` field is always available and corresponds to the Notion page ID, useful for:

- Linking between related records
- Building URLs to Notion pages
- Caching and state management

## Property Name Mapping

Notion CMS preserves your exact Notion property names, including:

- Spaces: `"Client Name"` stays as `"Client Name"`
- Special characters: All preserved
- Case sensitivity: Matches your Notion database exactly

Access properties using bracket notation for names with spaces:

```typescript
record["Client Name"]  // ✅ Correct
record.Client Name     // ❌ Syntax error
```

## Type Safety

When you generate types, TypeScript knows exactly which properties exist:

```typescript
// TypeScript autocomplete works!
const record = await notionCMS
  .query("eRPDataSourceClients", { recordType: "simple" })
  .single()

record["Client Name"] // ✅ Autocomplete suggests this
record.InvalidProperty // ❌ TypeScript error - doesn't exist
```

## Next Steps

- Learn about **[Type Generation](./03-type-generation.md)** to enable type safety
- Explore **[Querying Data](./04-querying-data.md)** with filters and sorting
- See **[Real-World Examples](./07-examples.md)** showing all three layers
