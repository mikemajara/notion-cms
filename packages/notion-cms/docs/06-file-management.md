# File Management

Notion CMS provides flexible file management strategies for handling files stored in Notion. This is essential because Notion-hosted files have expiring URLs that become invalid after approximately 1 hour.

## The Problem

Notion serves files (images, PDFs, videos, etc.) through temporary AWS URLs that expire:

```typescript
// ❌ This URL expires after ~1 hour
https://s3.us-west-2.amazonaws.com/secure.notion-static.com/abc123/...
```

This causes issues for:

- Static site generators (files break after build)
- Caching systems (cached pages reference broken URLs)
- Production applications (images stop loading)

## Solution: File Caching

Notion CMS can automatically download and cache files, providing stable URLs that don't expire.

## File Strategies

Notion CMS supports three file handling strategies:

### 1. Direct Strategy (Default)

Files are served directly from Notion's temporary URLs. No caching occurs.

```typescript
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "direct" // Default - no caching
  }
})

// Files use original Notion URLs
// ⚠️ URLs expire after ~1 hour
```

**Use When:**

- ✅ Development/testing
- ✅ Files are accessed immediately after fetching
- ✅ You don't need long-term file storage

### 2. Local Strategy

Files are downloaded and stored on your local filesystem.

```typescript
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "local",
    storage: {
      path: "./public/assets/notion-files" // Required: Where to store files
    }
  }
})

// Files are cached locally
// ✅ Stable URLs: /assets/notion-files/abc123.jpg
```

**Note:** The `path` option is required for the local strategy. If omitted, the default path `./public/assets/notion-files` will be used, but you should explicitly set it to ensure files are stored where your application can serve them.

**Use When:**

- ✅ Static site generators (Next.js, Gatsby, etc.)
- ✅ Small to medium-sized applications
- ✅ You have filesystem access
- ✅ Files don't need to be served from CDN

### 3. Remote Strategy (S3-Compatible)

Files are uploaded to S3-compatible storage (AWS S3, Vercel Blob, DigitalOcean Spaces, etc.).

```typescript
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "remote",
    storage: {
      endpoint: "https://s3.amazonaws.com", // or your S3-compatible endpoint
      bucket: "my-bucket",
      accessKey: process.env.S3_ACCESS_KEY!,
      secretKey: process.env.S3_SECRET_KEY!,
      region: "us-east-1", // Optional
      path: "notion-files/" // Optional: prefix for file keys
    }
  }
})

// Files are stored in S3
// ✅ Stable URLs: https://my-bucket.s3.amazonaws.com/notion-files/abc123.jpg
```

**Use When:**

- ✅ Production applications
- ✅ Large-scale applications
- ✅ Files need CDN distribution
- ✅ You're using serverless/edge functions

## Supported Storage Providers

The remote strategy works with any S3-compatible storage:

### AWS S3

```typescript
storage: {
  endpoint: "https://s3.amazonaws.com",
  bucket: "my-bucket",
  accessKey: process.env.AWS_ACCESS_KEY_ID!,
  secretKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: "us-east-1"
}
```

### Vercel Blob

```typescript
storage: {
  endpoint: "https://blob.vercel-storage.com",
  bucket: "my-bucket",
  accessKey: process.env.BLOB_READ_WRITE_TOKEN!,
  secretKey: "" // Not needed for Vercel Blob
}
```

### DigitalOcean Spaces

```typescript
storage: {
  endpoint: "https://nyc3.digitaloceanspaces.com",
  bucket: "my-space",
  accessKey: process.env.DO_SPACES_KEY!,
  secretKey: process.env.DO_SPACES_SECRET!,
  region: "nyc3"
}
```

### Cloudflare R2

```typescript
storage: {
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  bucket: "my-bucket",
  accessKey: process.env.R2_ACCESS_KEY_ID!,
  secretKey: process.env.R2_SECRET_ACCESS_KEY!
}
```

### MinIO (Self-Hosted)

```typescript
storage: {
  endpoint: "https://minio.example.com",
  bucket: "my-bucket",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!
}
```

## How It Works

### Automatic Processing

When file caching is enabled, files are automatically processed:

1. **Detection**: Notion CMS detects file URLs in:

   - Database properties (Files property type)
   - Content blocks (images, videos, files, PDFs)

2. **Download**: Files are downloaded from Notion's temporary URLs

3. **Storage**: Files are stored using your chosen strategy:

   - **Local**: Saved to filesystem
   - **Remote**: Uploaded to S3-compatible storage

4. **URL Replacement**: Original URLs are replaced with stable cached URLs

5. **Caching**: Subsequent requests use cached files (no re-download)

### File ID Generation

Files are identified by a stable ID derived from the Notion URL:

```typescript
// Original Notion URL:
// https://s3.us-west-2.amazonaws.com/.../abc-123-def-456-...

// Generated stable ID:
// abc123def456 (UUID parts without hyphens)

// Cached file:
// /assets/notion-files/abc123def456.jpg
```

### File Extension Detection

File extensions are preserved from the original filename:

```typescript
// Original: "photo.jpg"
// Cached: "abc123def456.jpg"

// Original: "document.pdf"
// Cached: "abc123def456.pdf"
```

## Usage Examples

### Example: Next.js Static Site

```typescript
// next.config.js or page component
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "local",
    storage: {
      path: "./public/notion-files"
    }
  }
})

// Generate static pages
export async function generateStaticParams() {
  const posts = await notionCMS
    .query("blogPosts", { recordType: "simple" })
    .all()

  // Files are automatically cached during build
  for (const post of posts) {
    const blocks = await notionCMS.getPageContent(post.id)
    // Images now use stable URLs
  }
}
```

### Example: Serverless Function

```typescript
// API route handler
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "remote",
    storage: {
      endpoint: process.env.S3_ENDPOINT!,
      bucket: process.env.S3_BUCKET!,
      accessKey: process.env.S3_ACCESS_KEY!,
      secretKey: process.env.S3_SECRET_KEY!,
      path: "notion-cache/"
    }
  }
})

export async function GET(request: Request) {
  const pageId = new URL(request.url).searchParams.get("pageId")
  const blocks = await notionCMS.getPageContent(pageId!)
  const markdown = blocksToMarkdown(blocks)

  // All images/files use S3 URLs
  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown" }
  })
}
```

### Example: Database File Properties

```typescript
// Files in database properties are also cached
const records = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .all()

records.forEach((record) => {
  // Files property contains cached URLs
  record.Attachments.forEach((file) => {
    console.log(file.url) // Cached URL, not Notion URL
  })
})
```

## Error Handling

File caching gracefully handles errors:

```typescript
// If file download fails, original URL is returned
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "local",
    storage: {
      path: "./public/assets/notion-files"
    }
  }
})

// Even if caching fails, your app continues working
// Warning logged: "Failed to cache file locally: image.jpg"
// Original Notion URL is used as fallback
```

## Performance Considerations

### Local Strategy

- ✅ Fast for small to medium files
- ✅ No external API calls
- ⚠️ Slower for large files
- ⚠️ Uses local disk space

### Remote Strategy

- ✅ Scalable for any file size
- ✅ CDN-ready URLs
- ⚠️ Requires S3 API calls (can be slow)
- ⚠️ Incurs storage costs

### Caching Behavior

- Files are only downloaded once per unique URL
- Subsequent requests use cached files
- Cache is checked before downloading

## Best Practices

### 1. Use Environment Variables

Store sensitive credentials in environment variables:

```bash
# .env.local
NOTION_API_KEY=secret_...
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
S3_BUCKET=my-bucket
S3_ENDPOINT=https://s3.amazonaws.com
```

### 2. Choose the Right Strategy

- **Development**: Use `direct` for speed
- **Static Sites**: Use `local` for simplicity
- **Production**: Use `remote` for scalability

### 3. Organize File Paths

Use path prefixes to organize files:

```typescript
storage: {
  path: "notion-files/blog/" // Organize by type
}
```

### 4. Monitor Storage Usage

For remote storage, monitor your bucket usage and set up lifecycle policies if needed.

### 5. CDN Integration

After caching to S3, configure CloudFront or similar CDN for faster global delivery.

## Troubleshooting

### Files Not Caching

**Check:**

- File strategy is correctly configured
- Storage path/bucket exists and is writable
- Credentials are correct (for remote strategy)
- Check console warnings for error messages

### Files Downloading Multiple Times

Files should only download once. If you see repeated downloads:

- Check that file IDs are being generated correctly
- Verify cache directory is persistent
- Ensure no duplicate file processing

### Permission Errors

**Local Strategy:**

- Ensure directory exists and is writable
- Check filesystem permissions

**Remote Strategy:**

- Verify S3 credentials have write permissions
- Check bucket policies allow uploads
- Ensure bucket exists

## Next Steps

- Review **[Limitations](./08-limitations.md)** - Complete feature supportability
- See **[Real-World Examples](./07-examples.md)** - File management patterns
- Check **[Content Blocks](./05-content-blocks.md)** - How files appear in blocks
