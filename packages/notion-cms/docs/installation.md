---
title: "Installation Guide"
description: "Complete installation and setup guide for Notion CMS library."
date: "2024-01-17"
---

# Installation

This guide covers different ways to install and configure Notion CMS in your project.

## Package Installation

### Using pnpm (Recommended)

```bash
pnpm add @mikemajara/notion-cms
```

### Using npm

```bash
npm install @mikemajara/notion-cms
```

### Using yarn

```bash
yarn add @mikemajara/notion-cms
```

## TypeScript Setup

Notion CMS is built with TypeScript and provides full type safety. If you're using TypeScript, no additional setup is required.

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Environment Configuration

### Setting up Environment Variables

Create a `.env` file in your project root:

```bash
# Required
NOTION_API_KEY=secret_your_notion_integration_token

# Optional - Database IDs for easy reference
BLOG_DATABASE_ID=your_blog_database_id
PRODUCTS_DATABASE_ID=your_products_database_id
```

### Loading Environment Variables

#### Node.js Applications

```typescript
// Load environment variables
import dotenv from "dotenv"
dotenv.config()

import { NotionCMS } from "@mikemajara/notion-cms"

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!)
```

#### Next.js Applications

Next.js automatically loads `.env.local` files:

```typescript
// pages/api/blog.ts or app/api/blog/route.ts
import { NotionCMS } from "@mikemajara/notion-cms"

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!)
```

#### Vercel Deployment

Add environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `NOTION_API_KEY` with your integration token

#### Netlify Deployment

Add environment variables in your Netlify dashboard:

1. Go to Site settings → Environment variables
2. Add `NOTION_API_KEY` with your integration token

## Notion Setup

### 1. Create a Notion Integration

1. Visit [Notion's Developer Portal](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Fill in the integration details:
   - **Name**: Your app name (e.g., "My Blog CMS")
   - **Logo**: Optional logo for your integration
   - **Associated workspace**: Select your workspace
4. Click "Submit"
5. Copy the "Internal Integration Token" - this is your `NOTION_API_KEY`

### 2. Configure Integration Capabilities

Set the capabilities your integration needs:

- **Read content**: Required for fetching database records and page content
- **Update content**: Required if you plan to update records
- **Insert content**: Required if you plan to create new records
- **Read comments**: Optional, for comment-related features
- **Read user information**: Optional, for user-related data

### 3. Share Databases with Your Integration

For each database you want to access:

1. Open the database in Notion
2. Click "Share" in the top right corner
3. Click "Invite" and search for your integration name
4. Select your integration and click "Invite"

**Important**: Your integration can only access databases that have been explicitly shared with it.

## Database ID Reference

### Finding Database IDs

Database IDs can be found in several ways:

#### Method 1: From the URL

When viewing a database in Notion, the URL contains the database ID:

```
https://www.notion.so/workspace/32_character_database_id?v=view_id
```

#### Method 2: Using the Share Menu

1. Click "Share" on your database
2. Click "Copy link"
3. Extract the 32-character ID from the URL

#### Method 3: Using the API

```typescript
// Search for databases by title
const searchResults = await notionCms.search({
  query: "My Blog Database",
  filter: { property: "object", value: "database" },
})

console.log(searchResults.results[0].id) // Your database ID
```

## Verification

Test your installation with this simple script:

```typescript
// test-installation.ts
import { NotionCMS } from "@mikemajara/notion-cms"

async function testInstallation() {
  try {
    const notionCms = new NotionCMS(process.env.NOTION_API_KEY!)

    // Test API connection
    const user = await notionCms.getUser()
    console.log("✅ Connection successful!")
    console.log("Bot user:", user.name)

    // Test database access (replace with your database ID)
    if (process.env.TEST_DATABASE_ID) {
      const { results } = await notionCms.getDatabase(
        process.env.TEST_DATABASE_ID
      )
      console.log(
        `✅ Database access successful! Found ${results.length} records.`
      )
    }
  } catch (error) {
    console.error("❌ Installation test failed:", error)
  }
}

testInstallation()
```

Run the test:

```bash
npx ts-node test-installation.ts
```

## Common Installation Issues

### Issue: "Unauthorized" Error

**Cause**: Invalid or missing API key

**Solution**:

- Verify your `NOTION_API_KEY` is correct
- Ensure the integration token hasn't been regenerated
- Check that environment variables are loading correctly

### Issue: "Object not found" Error

**Cause**: Database not shared with integration or incorrect database ID

**Solution**:

- Verify the database is shared with your integration
- Double-check the database ID format (32 characters, no dashes)
- Ensure you're using the database ID, not the page ID

### Issue: TypeScript Compilation Errors

**Cause**: Incompatible TypeScript configuration

**Solution**:

- Ensure TypeScript version 4.5 or later
- Update your `tsconfig.json` with the recommended settings above
- Install `@types/node` if using Node.js specific APIs

### Issue: Module Not Found

**Cause**: Package not properly installed or cached

**Solution**:

```bash
# Clear package manager cache
pnpm store prune
# or
npm cache clean --force

# Reinstall dependencies
pnpm install
# or
npm install
```

## Next Steps

Once installation is complete:

1. **[Get Started](./getting-started.md)** - Basic usage examples
2. **[Core Concepts](./core-concepts.md)** - Understand the layered API
3. **[Type Generation](./api-reference/type-generation.md)** - Generate TypeScript types from your databases
4. **[Examples](./examples/)** - Real-world usage patterns
