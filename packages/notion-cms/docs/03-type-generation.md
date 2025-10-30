# Type Generation

Type generation is the foundation of Notion CMS's type safety. Similar to `prisma generate` or Drizzle migrations, it introspects your Notion databases and generates TypeScript types that enable autocomplete, type checking, and safe queries.

## Overview

The `notion-cms generate` command:

1. Connects to your Notion database using the API
2. Discovers all data sources within the database
3. Analyzes property types and configurations
4. Generates TypeScript types for each data source
5. Creates a registry system for type-safe queries

## Installation

The CLI tool is included with the package. Use it via `npx`:

```bash
npx notion-cms generate [options]
```

Or install globally (not recommended):

```bash
pnpm add -g @mikemajara/notion-cms
notion-cms generate [options]
```

## Basic Usage

### Single Database

Generate types for a single database:

```bash
npx notion-cms generate \
  --token your-notion-api-token \
  --database your-database-id \
  --output ./notion
```

This will:

- Create a `notion` directory in your project
- Generate one TypeScript file per data source
- Create an `index.ts` file that exports everything
- Register types with the NotionCMS class

### Multiple Databases

Generate types for multiple databases at once:

```bash
npx notion-cms generate \
  --token your-notion-api-token \
  --databases "db-id-1,db-id-2,db-id-3" \
  --output ./notion
```

**Note:** When generating multiple databases, each gets its own file. The `--databases` flag expects comma-separated IDs without spaces.

## Command Options

| Option        | Short | Required      | Description                              |
| ------------- | ----- | ------------- | ---------------------------------------- |
| `--token`     | `-t`  | Yes           | Your Notion API integration token        |
| `--database`  | `-d`  | Conditional\* | Single database ID to generate types for |
| `--databases` |       | Conditional\* | Comma-separated list of database IDs     |
| `--output`    | `-o`  | No            | Output directory (default: `./notion`)   |
| `--version`   | `-v`  | No            | Show version and exit                    |

\* Either `--database` or `--databases` must be provided, but not both.

## Finding Your Database ID

The database ID is in your Notion database URL:

```
https://notion.so/workspace/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6?v=...
                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                      This is your database ID
```

Copy the 32-character hexadecimal string between the workspace name and the query parameters.

## Generated Files Structure

After running the generator, you'll see:

```
notion/
├── index.ts                          # Main export file
├── notion-types-database-name.ts     # Type definitions for each data source
└── notion-types-another-name.ts      # Additional data sources
```

### Generated File Contents

Each generated file includes:

1. **Field Type Metadata** - Type information for each property
2. **Simple Record Interface** - Type for Simple layer queries
3. **Advanced Record Interface** - Type for Advanced layer queries
4. **Raw Record Interface** - Type for Raw layer queries
5. **Database Registry Extension** - Module augmentation for type safety

Example generated file:

```typescript
export const RecordMyDatabaseFieldTypes = {
  Title: { type: "title" },
  Tags: {
    type: "multi_select",
    options: ["Option1", "Option2"] as const
  },
  Created: { type: "created_time" }
  // ... more fields
} as const satisfies DatabaseFieldMetadata

export interface RecordMyDatabase extends DatabaseRecord {
  Title: string
  Tags: Array<"Option1" | "Option2">
  Created: string
  // ... more fields
}

// Registry extension for type-safe queries
// This uses TypeScript's module augmentation feature to extend the DatabaseRegistry
// interface without modifying the source code. When you import this file, TypeScript
// automatically knows about your database types.
declare module "@mikemajara/notion-cms" {
  interface DatabaseRegistry {
    myDatabase: {
      record: RecordMyDatabase
      recordAdvanced: RecordMyDatabaseAdvanced
      recordRaw: PageObjectResponse
      fields: typeof RecordMyDatabaseFieldTypes
    }
  }
}
```

## Using Generated Types

### Import the Types

Import the generated types in your code. When you import the generated types file, it:

1. Registers the database configuration with `NotionCMS.prototype.databases`
2. Extends the `DatabaseRegistry` interface via TypeScript module augmentation
3. Makes the database key available for type-safe queries

```typescript
// Import from the generated index file
// This import is what registers your types - make sure it runs before using NotionCMS.query()
import { NotionCMS } from "./notion"

// Types are now registered and available for type-safe queries
```

### Type-Safe Queries

Once imported, queries are fully type-safe:

```typescript
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

// TypeScript knows all available databases
const records = await notionCMS
  .query("myDatabase", { recordType: "simple" }) // ✅ Autocomplete works
  .all()

// TypeScript knows all properties
records[0].Title // ✅ Autocomplete + type checking
records[0].InvalidProperty // ❌ TypeScript error
```

## Database Keys vs Database IDs

Understanding the difference between these terms is important:

- **Database ID**: The 32-character hexadecimal string from Notion (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`). Used when generating types.
- **Database Key**: The generated TypeScript identifier used in queries (e.g., `eRPDataSourceClients`). Created from your database/data source name.

The generator creates a "database key" from your database/data source name. The key:

- Removes special characters
- Converts spaces to camelCase
- Makes it a valid TypeScript identifier

Examples:

- Database: "ERP (Data source: Clients)" → Key: `eRPDataSourceClients`
- Database: "Blog Posts" → Key: `blogPosts`
- Database: "Project_Tracker" → Key: `projectTracker`

You can find the exact key in your generated types file. Use the **Database Key** (not the Database ID) when calling `.query()`.

## Environment Variables

### API Token

Instead of passing the token via command line, you can use environment variables:

```bash
# .env
NOTION_API_KEY=secret_your_token_here
```

Then run:

```bash
npx notion-cms generate \
  --database your-database-id \
  --output ./notion
```

**Note:** The generator doesn't automatically read `.env` files. You'll need to load them yourself or use a tool like `dotenv-cli`:

```bash
npx dotenv-cli -e .env -- notion-cms generate --database your-db-id
```

### Data Source ID Override

Generated type files include hardcoded data source IDs, but you can override them using environment variables. This is useful for different environments (development, staging, production) that use different Notion databases.

The pattern is: `NOTION_CMS_<DATABASE_KEY>_DATA_SOURCE_ID`

For example, if your database key is `blogPosts`, you can override the data source ID:

```bash
# .env
NOTION_CMS_BLOGPOSTS_DATA_SOURCE_ID=your-data-source-id-here
```

When the generated types file loads, it will check for this environment variable first, falling back to the hardcoded value if not found.

This allows you to:

- Use the same codebase across environments
- Point to different Notion databases per environment
- Keep sensitive IDs out of your generated files (though database IDs aren't sensitive without the API token)

## Regenerating Types

You should regenerate types when:

- ✅ Adding new properties to your Notion database
- ✅ Changing property types in Notion
- ✅ Adding new data sources
- ✅ Updating to a new version of Notion CMS
- ✅ The library prompts you to regenerate

**Note:** Generated files are overwritten on each run. Don't edit them manually!

## Data Source Discovery

Notion databases can expose multiple "data sources" (similar to database views). The generator:

1. Finds all data sources in your database
2. Generates types for each one
3. Creates separate registry entries for each

This means one Notion database can result in multiple generated type files, each representing a different data source.

## Troubleshooting

### "Database does not expose any data sources"

Your database needs at least one data source configured in Notion. This is typically automatic, but check:

- The database is shared with your integration
- The integration has proper permissions
- You're using the correct database ID

### "Database not found in registry"

Make sure you:

1. Ran `notion-cms generate`
2. Imported the generated types file
3. Used the correct database key (check the generated file)

### Type errors after regenerating

Sometimes TypeScript needs a restart to pick up new types:

1. Restart your TypeScript server (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")
2. Clear your build cache
3. Restart your development server

### Multiple databases with same name

If you have multiple databases with similar names, the generator will create unique keys by appending numbers or using the data source name. Check the generated files to see the exact keys.

## Best Practices

1. **Version Control**: Commit generated types to your repository

   - They're deterministic and change only when your database changes
   - Helps with code reviews and deployment

2. **CI/CD Integration**: Regenerate types in your build process

   ```bash
   # In your build script
   npm run generate:types
   npm run build
   ```

3. **Separate Types Directory**: Keep generated types separate from your source code

   ```
   src/
   notion/          # Generated types
   lib/
   ```

4. **Document Database Keys**: Note which database keys correspond to which Notion databases in your README or docs

## Next Steps

- Learn about **[Querying Data](./04-querying-data.md)** with your generated types
- Understand **[Core Concepts](./02-core-concepts.md)** of the three-layer API
- See **[Real-World Examples](./07-examples.md)** from the monorepo
