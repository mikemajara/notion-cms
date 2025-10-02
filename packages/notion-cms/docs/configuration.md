# Configuration

Notion CMS ships with sensible defaults but can be tailored via `NotionCMSConfig` and the type generation CLI. This guide explains how to customise file handling, debug logging, and generate database metadata.

## Configuration overview

```ts
import { NotionCMS } from "@originui/notion-cms"

const notion = new NotionCMS(process.env.NOTION_TOKEN!, {
  files: {
    strategy: "local",
    storage: {
      path: "./public/notion-files"
    }
  },
  debug: {
    enabled: true,
    level: "info"
  }
})
```

`mergeConfig` combines user input with default values:

- `files.strategy` defaults to `"direct"`; other options are `"local"` and `"remote"`.
- `files.storage` contains shared fields (path, endpoint, credentials) used by the strategies.
- `debug` toggles scoped logging (see `debugging-and-troubleshooting.md`).

## File strategies

| Strategy           | Behaviour                                                                           | When to use                               |
| ------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| `direct` (default) | Returns Notion-hosted URLs untouched.                                               | Minimal setup, no caching needed.         |
| `local`            | Downloads assets once, stores them using `LocalStorage`, serves stable public URLs. | Static site exports, longer-lived URLs.   |
| `remote`           | Uploads files to S3-compatible storage via `S3Storage`.                             | CDN-backed delivery, multi-region setups. |

### Local strategy

- Requires a writable `storage.path` (defaults to `./public/assets/notion-files`).
- Uses `generateFileId()` to keep filenames stable between runs.
- Falls back to the original Notion URL if download fails.

### Remote strategy

```ts
const notion = new NotionCMS(token, {
  files: {
    strategy: "remote",
    storage: {
      endpoint: process.env.S3_ENDPOINT!,
      bucket: "notion-cms",
      accessKey: process.env.S3_ACCESS_KEY!,
      secretKey: process.env.S3_SECRET_KEY!,
      region: "us-east-1",
      path: "uploads/notion/"
    }
  }
})
```

- `endpoint`, `accessKey`, and `secretKey` are required.
- `bucket` defaults to `"default-bucket"`, but you should override it.
- Optional `path` prefixes all stored keys (e.g., `uploads/notion/page-id.png`).
- Errors are logged via `debug.error`; the original URL remains available.

### Checking cache state

```ts
const cached = notion["databaseService"] // internal
console.log(notion instanceof Object) // placeholder to discourage direct access
```

Public API:

```ts
import { FileManager } from "@originui/notion-cms"

// Via dependency injection in converters
const isCacheEnabled = fileManager.isCacheEnabled()
```

## Debug logging

`debug.configure` is called in the `NotionCMS` constructor. Settings:

- `enabled`: toggles logging entirely.
- `level`: `"error" | "warn" | "info" | "debug"`. Higher verbosity → more logs.

Logs include scoped helpers (`debug.query`, `debug.log`, `debug.error`) used across services.

## Type generation CLI

Generating database metadata improves DX and runtime validation.

1. Ensure the generator script is installed (comes with the package).
2. Create a script in your app:

```json
{
  "scripts": {
    "notion:generate": "ts-node packages/notion-cms/src/generator.ts"
  }
}
```

3. Run the generator with required env vars (database IDs, output path). Each project typically maintains a `notion-types-*.ts` file checked into source control.
4. Import the generated file early in your app (e.g., `_app.tsx`, entry server file) so `registerDatabase` runs before queries.

Generated files export types and call `registerDatabase("databaseKey", { id, fields })`. Fields are mapped to `DatabaseFieldMetadata`, powering autocomplete:

```ts
registerDatabase("blog", {
  id: "xxxxxxxx",
  fields: {
    Title: { type: "title" },
    Tags: { type: "multi_select", options: ["Docs", "Product"] },
    PublishedAt: { type: "date" }
  }
})
```

If you cannot run the generator (e.g., during prototyping), you can manually call `registerDatabase` with the same shape. Minimal metadata still unlocks QueryBuilder validation.
