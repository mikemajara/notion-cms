# Type Generation

Notion CMS can automatically generate TypeScript types and field metadata from your Notion databases, providing full type safety for your database operations.

## Overview

The type generation system:

- **Analyzes Database Schema** - Reads your Notion database structure
- **Generates TypeScript Types** - Creates interfaces for your records
- **Creates Field Metadata** - Provides type information for the Query Builder
- **Supports Multiple Databases** - Generate types for multiple databases at once
- **Property Type Mapping** - Maps Notion property types to TypeScript types

## CLI Usage

### Basic Command

```bash
npx notion-cms generate --database <database-id> --token <api-token>
```

### Command Options

| Option        | Short | Type      | Required | Description                                   |
| ------------- | ----- | --------- | -------- | --------------------------------------------- |
| `--database`  | `-d`  | `string`  | No\*     | Single database ID to generate types for      |
| `--databases` | -     | `string`  | No\*     | Multiple database IDs (comma-separated)       |
| `--output`    | `-o`  | `string`  | No       | Output directory (default: `./notion`)        |
| `--token`     | `-t`  | `string`  | Yes      | Notion API integration token                  |
| `--force`     | `-f`  | `boolean` | No       | Overwrite existing files without confirmation |

\*Either `--database` or `--databases` must be provided.

### Examples

#### Single Database

```bash
# Generate types for one database
npx notion-cms generate \
  --database "a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  --token "secret_abc123..." \
  --output "./src/types"
```

#### Multiple Databases

```bash
# Generate types for multiple databases
npx notion-cms generate \
  --databases "db1-id,db2-id,db3-id" \
  --token "secret_abc123..." \
  --output "./src/notion-types"
```

#### Force Overwrite

```bash
# Overwrite existing files without confirmation
npx notion-cms generate \
  --database "database-id" \
  --token "secret_abc123..." \
  --force
```

## Generated Files Structure

### Single Database Output

```
./notion/
├── notion-types.ts           # Base types and utilities
├── notion-types-blog.ts      # Database-specific types
└── index.ts                  # Exports all types
```

### Multiple Databases Output

```
./notion/
├── notion-types.ts           # Base types and utilities
├── notion-types-blog.ts      # Blog database types
├── notion-types-products.ts  # Products database types
├── notion-types-users.ts     # Users database types
└── index.ts                  # Exports all types
```

## Generated Type Structure

### Database Record Interface

For each database, a record interface is generated:

```typescript
// Generated for a blog database
export interface RecordBlog {
  id: string;
  Title: string;
  Status: "Draft" | "In Review" | "Published";
  Tags: Array<"react" | "typescript" | "nodejs">;
  "Publish Date": Date;
  Priority: number;
  "Is Featured": boolean;
  Author: string[];

  // Layered API access
  advanced: {
    id: string;
    Title: RichTextItemResponse[];
    Status: SelectOption;
    Tags: MultiSelectOption[];
    "Publish Date": DateResponse | null;
    Priority: number | null;
    "Is Featured": boolean;
    Author: UserObjectResponse[];
  };

  raw: {
    id: string;
    properties: {
      Title: TitlePropertyItemObjectResponse;
      Status: SelectPropertyItemObjectResponse;
      Tags: MultiSelectPropertyItemObjectResponse;
      // ... other raw property types
    };
  };
}
```

### Field Metadata

Field metadata is generated for enhanced Query Builder type safety:

```typescript
export const RecordBlogFieldMetadata = {
  Title: { type: "title" as const },
  Status: {
    type: "select" as const,
    options: ["Draft", "In Review", "Published"] as const,
  },
  Tags: {
    type: "multi_select" as const,
    options: ["react", "typescript", "nodejs"] as const,
  },
  "Publish Date": { type: "date" as const },
  Priority: { type: "number" as const },
  "Is Featured": { type: "checkbox" as const },
  Author: { type: "people" as const },
} as const;

export type RecordBlogFieldMetadata = typeof RecordBlogFieldMetadata;
```

### Utility Types

Additional utility types are generated:

```typescript
// Select option type for advanced API
export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

// Multi-select option type for advanced API
export interface MultiSelectOption {
  id: string;
  name: string;
  color: string;
}

// Date response type for advanced API
export interface DateResponse {
  start: string;
  end: string | null;
  time_zone: string | null;
}
```

## Property Type Mapping

### Notion to TypeScript Type Mapping

| Notion Property  | Simple API Type                   | Advanced API Type        | Notes                              |
| ---------------- | --------------------------------- | ------------------------ | ---------------------------------- |
| Title            | `string`                          | `RichTextItemResponse[]` | Plain text vs formatted            |
| Rich Text        | `string`                          | `RichTextItemResponse[]` | Markdown string vs rich formatting |
| Number           | `number`                          | `number \| null`         | Direct mapping                     |
| Select           | `"Option1" \| "Option2"`          | `SelectOption`           | Union of actual options            |
| Multi-select     | `Array<"Tag1" \| "Tag2">`         | `MultiSelectOption[]`    | Array of option objects            |
| Date             | `Date`                            | `DateResponse \| null`   | Date object vs raw response        |
| People           | `string[]`                        | `UserObjectResponse[]`   | Names vs full user objects         |
| Files            | `{name: string; url: string}[]`   | `FileObjectResponse[]`   | Simplified vs full file data       |
| Checkbox         | `boolean`                         | `boolean`                | Direct mapping                     |
| URL              | `string`                          | `string \| null`         | Direct mapping                     |
| Email            | `string`                          | `string \| null`         | Direct mapping                     |
| Phone            | `string`                          | `string \| null`         | Direct mapping                     |
| Formula          | `any`                             | `FormulaResponse`        | Depends on formula type            |
| Relation         | `string[]`                        | `RelationResponse[]`     | Page IDs vs relation objects       |
| Rollup           | `any`                             | `RollupResponse`         | Depends on rollup configuration    |
| Created Time     | `string`                          | `string`                 | ISO timestamp                      |
| Created By       | `{id: string; name: string; ...}` | `UserObjectResponse`     | User info                          |
| Last Edited Time | `string`                          | `string`                 | ISO timestamp                      |
| Last Edited By   | `{id: string; name: string; ...}` | `UserObjectResponse`     | User info                          |

### Special Property Handling

#### Select and Multi-Select Options

The generator extracts actual options from your database:

```typescript
// If your Status field has options: Draft, Published, Archived
Status: "Draft" | "Published" | "Archived";

// If your Tags field has options: react, vue, angular
Tags: Array<"react" | "vue" | "angular">;
```

#### Property Names with Special Characters

Properties with spaces or special characters are properly quoted:

```typescript
export interface RecordBlog {
  "Publish Date": Date; // Quoted because of space
  "SEO-Title": string; // Quoted because of hyphen
  Priority: number; // Not quoted (simple name)
}
```

## Using Generated Types

### Basic Usage

```typescript
import { RecordBlog, RecordBlogFieldMetadata } from "./notion-types";
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!);

// Fully typed database operations
const { results } = await notionCms.getDatabase<RecordBlog>("blog-db-id");

// TypeScript knows the exact shape
const post = results[0];
console.log(post.Title); // string
console.log(post.Status); // "Draft" | "In Review" | "Published"
console.log(post.Tags); // Array<"react" | "typescript" | "nodejs">
console.log(post["Publish Date"]); // Date
```

### With Query Builder

```typescript
import { RecordBlog, RecordBlogFieldMetadata } from "./notion-types";

// Enhanced type safety with field metadata
const posts = await notionCms
  .query<RecordBlog, RecordBlogFieldMetadata>(
    "blog-db-id",
    RecordBlogFieldMetadata
  )
  .where("Status")
  .equals("Published") // Only valid status options
  .where("Tags")
  .contains("react") // Only valid tag options
  .where("Priority")
  .greater_than(5) // Number operations for number fields
  .sort("Publish Date", "descending")
  .execute();
```

### Accessing Different API Layers

```typescript
const post = results[0];

// Simple API (clean JavaScript types)
console.log(post.Title); // "My Blog Post"
console.log(post.Status); // "Published"

// Advanced API (rich metadata)
console.log(post.advanced.Title); // RichTextItemResponse[]
console.log(post.advanced.Status); // SelectOption with color, id, etc.

// Raw API (complete Notion response)
console.log(post.raw.properties.Title); // Full Notion API response
console.log(post.raw.created_time); // ISO timestamp
```

## Configuration and Customization

### Environment Variables

Set up environment variables for easier CLI usage:

```bash
# .env
NOTION_API_KEY=secret_your_integration_token
BLOG_DATABASE_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
PRODUCTS_DATABASE_ID=b2c3d4e5-f6g7-8901-bcde-fg2345678901
```

Then use in package.json scripts:

```json
{
  "scripts": {
    "generate-types": "notion-cms generate --database $BLOG_DATABASE_ID --token $NOTION_API_KEY",
    "generate-all-types": "notion-cms generate --databases $BLOG_DATABASE_ID,$PRODUCTS_DATABASE_ID --token $NOTION_API_KEY"
  }
}
```

### Integration with Build Process

#### Package.json Scripts

```json
{
  "scripts": {
    "prebuild": "pnpm generate-types",
    "build": "tsc",
    "dev": "concurrently \"pnpm generate-types --watch\" \"tsc --watch\"",
    "generate-types": "notion-cms generate --database $DATABASE_ID --token $NOTION_API_KEY --output ./src/types"
  }
}
```

#### GitHub Actions

```yaml
# .github/workflows/generate-types.yml
name: Generate Types
on:
  schedule:
    - cron: "0 0 * * *" # Daily at midnight
  workflow_dispatch:

jobs:
  generate-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npx notion-cms generate --database ${{ secrets.DATABASE_ID }} --token ${{ secrets.NOTION_API_KEY }}
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          git diff --staged --quiet || git commit -m "Update generated types"
          git push
```

## Troubleshooting

### Common Issues

#### Database Not Found

```bash
Error: object_not_found
```

**Solutions:**

- Verify the database ID is correct
- Ensure the database is shared with your integration
- Check that your API token is valid

#### Invalid Token

```bash
Error: unauthorized
```

**Solutions:**

- Verify your Notion API token is correct
- Ensure the token hasn't been regenerated
- Check that the integration has the necessary capabilities

#### Property Type Conflicts

```bash
Error: Unable to determine property type for 'PropertyName'
```

**Solutions:**

- Ensure all database records have consistent property types
- Check for recently changed property configurations
- Try regenerating after database schema stabilizes

#### File Already Exists

```
File already exists: ./notion/notion-types.ts
Do you want to overwrite it? (y/N):
```

**Solutions:**

- Use `--force` flag to overwrite automatically
- Answer 'y' to overwrite manually
- Use a different output directory with `--output`

### Debugging Tips

#### Verbose Output

Add debugging to understand what's happening:

```typescript
// Add to your environment
DEBUG=notion-cms:* npx notion-cms generate --database db-id --token token
```

#### Inspect Generated Files

Check the generated files to understand the type mappings:

```bash
# View generated types
cat ./notion/notion-types-blog.ts

# Check field metadata
grep -A 20 "FieldMetadata" ./notion/notion-types-blog.ts
```

## Best Practices

### 1. Version Control

```gitignore
# .gitignore - Choose your approach

# Option A: Commit generated types (recommended for small teams)
# /notion/

# Option B: Ignore generated types (generate during build)
/notion/
```

### 2. Regular Regeneration

Set up automatic type regeneration:

```json
{
  "scripts": {
    "postinstall": "pnpm generate-types",
    "predev": "pnpm generate-types",
    "prebuild": "pnpm generate-types"
  }
}
```

### 3. Database Schema Stability

- Establish clear property naming conventions
- Avoid frequent property type changes
- Use consistent option naming for select fields

### 4. Multiple Environments

```bash
# Development
npx notion-cms generate --database $DEV_DATABASE_ID --token $DEV_NOTION_API_KEY

# Production
npx notion-cms generate --database $PROD_DATABASE_ID --token $PROD_NOTION_API_KEY
```

## Migration Guide

### From Manual Types

If you have existing manual type definitions:

1. **Backup Existing Types**

   ```bash
   cp ./src/types/notion.ts ./src/types/notion.ts.backup
   ```

2. **Generate New Types**

   ```bash
   npx notion-cms generate --database your-db-id --token your-token --output ./src/types
   ```

3. **Update Imports**

   ```typescript
   // Old
   import { BlogPost } from "./types/notion";

   // New
   import { RecordBlog } from "./types/notion-types";
   ```

4. **Update Usage**

   ```typescript
   // Old
   const posts: BlogPost[] = await fetchPosts();

   // New
   const posts = await notionCms.getDatabase<RecordBlog>("blog-db-id");
   ```

## Related Documentation

- **[Database Operations](./database-operations.md)** - Using generated types with database operations
- **[Query Builder](./query-builder.md)** - Enhanced type safety with field metadata
- **[Installation Guide](../installation.md)** - Setting up environment variables
