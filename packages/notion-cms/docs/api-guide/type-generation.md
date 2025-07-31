# Type Generation

Generate TypeScript types and database-specific query methods from your Notion databases for full type safety and autocomplete.

## Quick Start

```bash
# Generate types for your database
npx @mikemajara/notion-cms generate -t YOUR_API_KEY -d YOUR_DATABASE_ID
```

This creates two main files:
- **Types file**: Complete TypeScript interfaces for your database
- **Query methods**: Database-specific methods added to NotionCMS

## Generated Query Methods

The type generator creates database-specific query methods that provide full type safety:

```typescript
// Before generation - generic query
const results = await cms.query("database-id").filter("Status", "equals", "Published").all()

// After generation - typed query method
const results = await cms.queryProductCatalog("database-id")
  .filter("Category", "equals", "Electronics") // ✅ Full autocomplete
  .filter("Price", "greater_than", 100)         // ✅ Type-safe operators
  .all() // ✅ Fully typed results
```

## Example Generated File

For a Product Catalog database, the generator creates:

```typescript
// notion-types-product-catalog.ts
export const RecordProductCatalogFieldTypes = {
  "Name": { type: "title" },
  "Category": { 
    type: "select",
    options: ["Electronics", "Clothing", "Home & Kitchen"] as const
  },
  "Price": { type: "number" },
  "In Stock": { type: "checkbox" },
  "Tags": { 
    type: "multi_select",
    options: ["Audio", "Wireless", "Organic"] as const
  }
} as const satisfies DatabaseFieldMetadata;

// Database-specific interfaces
export interface RecordProductCatalog extends DatabaseRecord {
  Name: string;
  Category: "Electronics" | "Clothing" | "Home & Kitchen";
  Price: number;
  "In Stock": boolean;
  Tags: Array<"Audio" | "Wireless" | "Organic">;
}

// Extend NotionCMS with typed query method
declare module "@mikemajara/notion-cms" {
  interface NotionCMS {
    queryProductCatalog(databaseId: string): QueryBuilder<RecordProductCatalog, typeof RecordProductCatalogFieldTypes>;
  }
}

// Add the method to NotionCMS prototype
NotionCMS.prototype.queryProductCatalog = function(databaseId: string) {
  return this.query<RecordProductCatalog, typeof RecordProductCatalogFieldTypes>(
    databaseId, 
    RecordProductCatalogFieldTypes
  );
};
```

## Using Generated Types

### Import and Use

```typescript
import { NotionCMS } from "@mikemajara/notion-cms"
import "./notion/notion-types-product-catalog" // Import to extend NotionCMS
import { RecordProductCatalog } from "./notion/notion-types-product-catalog"

const cms = new NotionCMS(process.env.NOTION_API_KEY!)

// Use the generated typed method
const products = await cms.queryProductCatalog(process.env.DATABASE_ID!)
  .filter("Category", "equals", "Electronics") // ✅ Autocomplete suggests valid categories
  .filter("In Stock", "equals", true)          // ✅ TypeScript knows this is boolean
  .sort("Price", "ascending")                  // ✅ Valid sort directions
  .all()

// Results are fully typed
products.forEach(product => {
  console.log(product.Name)     // ✅ TypeScript knows this is string
  console.log(product.Price)    // ✅ TypeScript knows this is number
  console.log(product.Category) // ✅ TypeScript knows valid options
})
```

### Type Safety Benefits

**Select Fields**: Only valid options are allowed
```typescript
await cms.queryProductCatalog(dbId)
  .filter("Category", "equals", "Electronics") // ✅ Valid
  .filter("Category", "equals", "Invalid")     // ❌ TypeScript error
```

**Multi-Select Fields**: Type-safe option checking
```typescript
await cms.queryProductCatalog(dbId)
  .filter("Tags", "contains", "Audio")    // ✅ Valid tag
  .filter("Tags", "contains", "BadTag")   // ❌ TypeScript error
```

**Operators**: Only valid operators for each field type
```typescript
await cms.queryProductCatalog(dbId)
  .filter("Price", "greater_than", 100)     // ✅ Valid for numbers
  .filter("Price", "contains", "text")      // ❌ TypeScript error
```

## CLI Options

### Basic Generation
```bash
npx @mikemajara/notion-cms generate -t TOKEN -d DATABASE_ID
```

### Advanced Options
```bash
# Specify output file name
npx @mikemajara/notion-cms generate -t TOKEN -d DATABASE_ID -f

# Force overwrite existing files  
npx @mikemajara/notion-cms generate -t TOKEN -d DATABASE_ID -f
```

### Environment Variables
```bash
# Use environment variables
export NOTION_API_KEY=your_token
export NOTION_CMS_DATABASE_ID=your_database_id

npx @mikemajara/notion-cms generate -t $NOTION_API_KEY -d $NOTION_CMS_DATABASE_ID
```

## Integration Patterns

### Next.js Integration
```typescript
// lib/notion.ts
import { NotionCMS } from "@mikemajara/notion-cms"
import "./notion-types-product-catalog"

export const cms = new NotionCMS(process.env.NOTION_API_KEY!)

// actions/products.ts  
export async function getProducts() {
  return await cms.queryProductCatalog(process.env.PRODUCT_DB_ID!)
    .filter("In Stock", "equals", true)
    .sort("Name", "ascending")
    .all()
}
```

### React Hook
```typescript
import { useState, useEffect } from 'react'
import type { RecordProductCatalog } from './notion/notion-types-product-catalog'

export function useProducts() {
  const [products, setProducts] = useState<RecordProductCatalog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const results = await cms.queryProductCatalog(DATABASE_ID)
        .filter("In Stock", "equals", true)
        .all()
      setProducts(results)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  return { products, loading }
}
```

## Multiple Databases

Generate types for multiple databases:

```bash
# Generate for blog database
npx @mikemajara/notion-cms generate -t TOKEN -d BLOG_DB_ID

# Generate for products database  
npx @mikemajara/notion-cms generate -t TOKEN -d PRODUCTS_DB_ID

# Generate for team database
npx @mikemajara/notion-cms generate -t TOKEN -d TEAM_DB_ID
```

Use multiple typed methods:
```typescript
import "./notion/notion-types-blog"
import "./notion/notion-types-products" 
import "./notion/notion-types-team"

// Now you have multiple typed methods
const posts = await cms.queryBlog(BLOG_DB_ID).filter("Status", "equals", "Published").all()
const products = await cms.queryProducts(PRODUCTS_DB_ID).filter("In Stock", "equals", true).all()
const team = await cms.queryTeam(TEAM_DB_ID).filter("Active", "equals", true).all()
```

## Regenerating Types

Re-run the generator when your Notion database schema changes:

```bash
# Schema changed? Regenerate types
npx @mikemajara/notion-cms generate -t TOKEN -d DATABASE_ID -f
```

**When to regenerate:**
- Added new properties to your database
- Changed property types (select → multi-select)
- Added/removed select options
- Renamed properties

## Best Practices

### 1. Keep Types in Version Control
```bash
# Add generated files to git
git add notion/
git commit -m "Update database types"
```

### 2. Use in Package.json Scripts
```json
{
  "scripts": {
    "generate-types": "notion-cms generate -t $NOTION_API_KEY -d $NOTION_CMS_DATABASE_ID -f"
  }
}
```

### 3. Validate Before Deployment
```typescript
// Ensure types match your expectations
type ProductCategory = RecordProductCatalog['Category']
// Should be: "Electronics" | "Clothing" | "Home & Kitchen"
```

### 4. Handle Optional Properties
```typescript
// Some properties might be null/undefined
const product = results[0]
if (product.Tags?.length > 0) {
  console.log("Has tags:", product.Tags.join(", "))
}
```

## Troubleshooting

### Common Errors

**"Property not found"**
```bash
# Your database schema may have changed
npx @mikemajara/notion-cms generate -t TOKEN -d DATABASE_ID -f
```

**"Invalid API key"**
```bash
# Check your token has access to the database
export NOTION_API_KEY=your_correct_token
```

**"Database not accessible"**
- Ensure your integration has access to the database
- Check the database ID is correct
- Verify the database hasn't been deleted or moved

### Debug Mode
```bash
# Enable debug logging
DEBUG=notion-cms npx @mikemajara/notion-cms generate -t TOKEN -d DATABASE_ID
```

Type generation creates the foundation for a fully typed, autocomplete-enabled Notion CMS experience that scales with your database changes.