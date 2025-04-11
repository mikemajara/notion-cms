# Notion CMS

A TypeScript library for generating type definitions from Notion databases and simplifying interaction with the Notion API.

## Features

- ✅ Automatically generate TypeScript interfaces from Notion database schema
- ✅ Type-safe access to your Notion database records
- ✅ Simplified data retrieval with pagination, filtering, and sorting
- ✅ Clean, easy-to-use API for interacting with Notion

## Installation

```bash
npm install notion-cms
```

## Getting Started

### 1. Generate Type Definitions

First, generate the TypeScript type definitions based on your Notion database structure:

```typescript
import { generateTypes } from "notion-cms";

// Replace with your actual values
const NOTION_TOKEN = "your-notion-api-token";
const DATABASE_ID = "your-database-id";
const OUTPUT_PATH = "./src/types";

async function generateNotionTypes() {
  await generateTypes(DATABASE_ID, OUTPUT_PATH, NOTION_TOKEN);
  console.log("Types generated successfully!");
}

generateNotionTypes().catch(console.error);
```

This will create a `notion-types.ts` file in your specified output directory that includes:

- A `DatabaseRecord` interface representing your database records
- Helper types and utility functions for working with Notion data

### 2. Using the Generated Types

Once you have your types generated, you can use the `NotionCMS` class to interact with your Notion database:

```typescript
import { NotionCMS } from "notion-cms";
import { DatabaseRecord } from "./types/notion-types";

// Extend the DatabaseRecord interface for your specific database
interface BlogPost extends DatabaseRecord {
  title: string;
  slug: string;
  content: string;
  publishedAt: Date;
  tags: string[];
  isPublished: boolean;
}

// Initialize the Notion CMS client
const notionCMS = new NotionCMS("your-notion-api-token");

// Get all published blog posts
async function getPublishedPosts() {
  const posts = await notionCMS.getAllDatabaseRecords<BlogPost>(
    "your-database-id",
    {
      filter: {
        property: "isPublished",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "publishedAt",
          direction: "descending",
        },
      ],
    }
  );

  return posts;
}

// Get a single post by ID
async function getPostById(postId: string) {
  const post = await notionCMS.getRecord<BlogPost>(postId);
  return post;
}
```

## API Reference

### NotionCMS Class

#### Constructor

```typescript
const notionCMS = new NotionCMS("your-notion-api-token");
```

#### Methods

- **getDatabase<T>**: Get records from a database with pagination

  ```typescript
  const response = await notionCMS.getDatabase<BlogPost>(databaseId, {
    filter: { property: "status", select: { equals: "Published" } },
    sorts: [{ property: "date", direction: "descending" }],
    pageSize: 10,
  });
  ```

- **getAllDatabaseRecords<T>**: Get all records from a database (handles pagination automatically)

  ```typescript
  const allPosts = await notionCMS.getAllDatabaseRecords<BlogPost>(databaseId, {
    filter: { property: "category", select: { equals: "Technology" } },
  });
  ```

- **getRecord<T>**: Get a single record by ID
  ```typescript
  const post = await notionCMS.getRecord<BlogPost>(pageId);
  ```

### Utility Functions

- **simplifyNotionRecord**: Convert a Notion page to a simplified record
- **simplifyNotionRecords**: Convert an array of Notion pages to simplified records
- **getPropertyValue**: Extract the value from a Notion property

## License

MIT
