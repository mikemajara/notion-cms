# File Management

Notion CMS centralises file handling through the `FileManager`. This guide covers how files are processed for records and blocks, and how to configure caching strategies.

## How file processing works

- `DatabaseService` enriches page covers, icons, and `files` properties before returning records.
- `PageContentService` updates media URLs (images, embeds, callouts) when fetching blocks.
- Conversion helpers (`convertRecordToSimple`, `convertRecordToAdvanced`, block converters) accept an optional `fileManager` to ensure URLs match your strategy.

## Strategies

| Strategy | Class            | Description                                                 |
| -------- | ---------------- | ----------------------------------------------------------- |
| `direct` | `DirectStrategy` | Returns URLs from Notion unchanged. Default behaviour.      |
| `local`  | `LocalStrategy`  | Downloads files once, writes to disk, serves stable URLs.   |
| `remote` | `RemoteStrategy` | Uploads files to S3-compatible storage with permanent URLs. |

Switch strategies via `NotionCMSConfig.files.strategy` (see `configuration.md`).

## Local caching

- Files are stored under `files.storage.path` (default `./public/assets/notion-files`).
- Storage implementation lives in `storage/s3-storage.ts` (`LocalStorage`).
- On subsequent requests, the file is reused if it already exists.
- Failures log a warning and fall back to the original URL.

### Cache eviction

Local caching has no built-in eviction. Manage the directory manually or integrate with your build pipeline (e.g., clean during deployments).

## Remote storage

Remote strategy uses the same `S3Storage` abstraction:

```ts
const notion = new NotionCMS(token, {
  files: {
    strategy: "remote",
    storage: {
      endpoint: "https://s3.example.com",
      bucket: "notion-cms",
      accessKey: process.env.S3_ACCESS_KEY!,
      secretKey: process.env.S3_SECRET_KEY!,
      path: "uploads/notion/"
    }
  }
})
```

- Supports any S3-compatible provider (AWS, MinIO, R2, Vercel Blob, etc.).
- `path` prefixes stored keys, keeping files grouped.
- Downloads use `downloadFile` utility and stream directly to storage.

## Checking strategy behaviour

```ts
import { FileManager } from "@originui/notion-cms"

const fileManager = new FileManager({
  files: { strategy: "local" }
})

console.log(fileManager.isCacheEnabled()) // true for local/remote
```

You rarely need to instantiate `FileManager` directly; `NotionCMS` creates it internally. Pass it explicitly only when you use converters outside the main services.

## Manual file processing

Use `fileManager.processFileUrl(url, fileName)` to process individual URLs:

```ts
const processedUrl = await fileManager.processFileUrl(
  "https://s3.eu-west-1.amazonaws.com/notion/asset.png",
  "asset.png"
)
```

- Returns the rewritten URL according to the current strategy.
- For direct strategy, the URL is unchanged.

## File metadata

`FileManager.createFileInfo` and `processFileInfoArray` help convert Notion file arrays into uniform objects:

```ts
const files = await fileManager.processFileInfoArray([
  { name: "hero.png", url: "https://..." }
])
```

Each object retains `name`, `url`, and (for Notion-hosted files) `expiry_time`. Use this in custom pipelines when you bypass the built-in record converters.

## Common pitfalls

- **Expired Notion URLs**: Use local or remote strategies for long-lived assets; direct links expire after a few hours.
- **Missing storage credentials**: Remote strategy throws if `storage` is not fully configured.
- **Large downloads**: For high-volume media libraries, consider a background job to warm caches rather than fetching on-demand.
