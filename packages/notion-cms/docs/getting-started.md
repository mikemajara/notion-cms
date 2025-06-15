# Getting Started

Welcome to Notion CMS! This guide will help you get up and running quickly with using Notion as a headless CMS.

## What is Notion CMS?

Notion CMS is a TypeScript library that simplifies working with Notion's API by providing:

- **Simple Data Access**: Get database records with JavaScript-friendly types
- **Layered API**: Access data at different levels of detail (simple, advanced, raw)
- **Type Safety**: Build type-safe database queries with filters and sorting
- **Automatic Pagination**: Handle large datasets seamlessly
- **Content Transformation**: Convert Notion blocks to Markdown or HTML

## Prerequisites

Before you begin, you'll need:

- Node.js 16 or later
- A Notion account and workspace
- A Notion integration token (we'll show you how to get one)

## Quick Start

### 1. Install the Package

```bash
pnpm add @mikemajara/notion-cms
# or
npm install @mikemajara/notion-cms
# or
yarn add @mikemajara/notion-cms
```

### 2. Get Your Notion API Key

1. Go to [Notion's Developer Portal](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name and select your workspace
4. Copy the "Internal Integration Token"

### 3. Share Your Database

1. Open your Notion database
2. Click "Share" in the top right
3. Click "Invite" and search for your integration name
4. Select your integration and click "Invite"

### 4. Get Your Database ID

Your database ID is in the URL when viewing your database:

```
https://www.notion.so/your-workspace/DATABASE_ID?v=...
```

### 5. Initialize and Use

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

// Initialize with your Notion API key
const notionCms = new NotionCMS("your-notion-api-key");

// Fetch all records from a database
const { results } = await notionCms.getDatabase("your-database-id");

// Work with the simplified records
console.log(results[0].Title); // Directly access a title property
console.log(results[0].Tags); // Access a multi-select property (as string[])
console.log(results[0].CreatedAt); // JavaScript Date object
```

## Your First Query

Let's try a more practical example. Suppose you have a blog database with these properties:

- **Title** (Title)
- **Status** (Select: Draft, Published, Archived)
- **Tags** (Multi-select)
- **Published Date** (Date)

```typescript
// Get all published blog posts
const { results } = await notionCms
  .query("your-blog-database-id")
  .where("Status")
  .equals("Published")
  .sort("Published Date", "descending")
  .execute();

// Display the posts
results.forEach((post) => {
  console.log(`${post.Title} - ${post["Published Date"]}`);
  console.log(`Tags: ${post.Tags.join(", ")}`);
});
```

## Environment Variables

For production applications, store your credentials in environment variables:

```bash
# .env
NOTION_API_KEY=your_notion_api_key_here
BLOG_DATABASE_ID=your_database_id_here
```

```typescript
// In your code
const notionCms = new NotionCMS(process.env.NOTION_API_KEY);
const { results } = await notionCms.getDatabase(process.env.BLOG_DATABASE_ID);
```

## What's Next?

Now that you have Notion CMS working, explore these guides:

- **[Core Concepts](./core-concepts.md)** - Understand the layered API architecture
- **[Installation Guide](./installation.md)** - Detailed setup and configuration
- **[API Reference](./api-reference/)** - Complete API documentation
- **[Examples](./examples/)** - Real-world usage patterns

## Need Help?

- Check our [Troubleshooting Guide](./troubleshooting.md)
- Browse the [Examples](./examples/) for common patterns
- Review the [API Reference](./api-reference/) for detailed documentation
