# Notion CMS Documentation

Use Notion as a headless CMS with a simple, powerful TypeScript API.

## Quick Start

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const cms = new NotionCMS("your-notion-api-key");

// Get database records with clean JavaScript types
const { results } = await cms.getDatabase("database-id");
console.log(results[0].Title); // Clean string access
```

## Core Features

### 📊 **Layered API Access**
- **Simple API**: Clean JavaScript types (`record.Title`, `record.Tags`)
- **Advanced API**: Rich metadata (`record.advanced.Tags[0].color`)
- **Raw API**: Complete Notion response (`record.raw.properties`)

### 🎯 **Type-Safe Queries**
```typescript
// Generate types and get full autocomplete
const posts = await cms.query("blog-db")
  .where("Status").equals("Published")
  .sort("Date", "desc")
  .execute();
```

### 🔄 **Content Conversion**
```typescript
// Convert Notion blocks to Markdown or HTML
const blocks = await cms.getPageContent("page-id");
const markdown = cms.blocksToMarkdown(blocks);
const html = cms.blocksToHtml(blocks);
```

### 📁 **Smart File Management**
- **Direct**: Link to Notion files (default)
- **Local Cache**: Download and cache locally
- **Remote Cache**: Store in S3-compatible storage

## Documentation

### Getting Started
- **[Getting Started](./getting-started.md)** - Setup and first query
- **[Core Concepts](./core-concepts.md)** - Understand the layered API

### API Guide
- **[Simplified API](./api-guide/simplified-api.md)** - Most common use cases
- **[Advanced API](./api-guide/advanced-api.md)** - Rich metadata and formatting
- **[Type Generation](./api-guide/type-generation.md)** - Generate TypeScript types
- **[Querying & Filtering](./api-guide/querying-and-filtering.md)** - Find and sort content
- **[Content Parsing](./api-guide/content-parsing.md)** - Markdown and HTML conversion
- **[File Management](./api-guide/file-management.md)** - Handle images and attachments

### Examples
- **[Basic Usage](./examples/basic-usage.md)** - Simple blog and CMS patterns
- **[Common Patterns](./examples/common-patterns.md)** - Real-world use cases

## Need Help?

- Check [Basic Usage](./examples/basic-usage.md) for common patterns
- Review [Core Concepts](./core-concepts.md) to understand the layered API
- Browse [Common Patterns](./examples/common-patterns.md) for real-world examples

## Installation

```bash
npm install @mikemajara/notion-cms
```

See [Getting Started](./getting-started.md) for complete setup instructions.