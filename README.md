# Notion CMS

A TypeScript library for using Notion as a headless CMS by generating strongly-typed interfaces from your Notion databases.

## Features

- Generate TypeScript interfaces from Notion database schemas
- Type-safe access to Notion database records
- Helper functions for extracting property values

## Installation

```bash
npm install notion-cms
```

## Usage

```typescript
import { generateTypes } from "notion-cms";

// Generate types from a Notion database
await generateTypes("your-database-id", "./src/types", "your-notion-api-token");

// Then import and use the generated types
import { DatabaseRecord } from "./src/types/notion-types";
```

## License

MIT
