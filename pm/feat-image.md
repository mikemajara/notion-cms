# File Management Feature - PRD

## Problem Statement

### Current Issues

Notion API returns **all uploaded file URLs** with **1-hour expiration**, causing critical problems:

1. **URL Expiration**: Files break after 1 hour on static pages with long revalidation periods
2. **Performance**: Every file request goes directly to Notion's AWS S3 (no caching)
3. **Reliability**: No fallback mechanism when Notion infrastructure is down
4. **SEO**: External AWS URLs with query parameters aren't optimal for SEO
5. **Cost**: Bandwidth costs scale directly with usage (no optimization)

### Affected File Types

- **Images**: jpg, png, gif, webp, svg
- **Documents**: pdf, docx, txt, md
- **Videos**: mp4, mov, avi
- **Audio**: mp3, wav, m4a
- **Archives**: zip, rar
- **Any uploaded file type**

### Example Problematic URL

```
https://prod-files-secure.s3.us-west-2.amazonaws.com/820e5dee-1891-4687-9f50-66fbd9c6eace/feefeb87-6c5b-4d0e-b820-c050524ea83e/team-nocoloco-aFbs3cwlpZI-unsplash.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPUSG26C%2F20250701%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250701T155907Z&X-Amz-Expires=3600&X-Amz-Security-Token=XXX&X-Amz-Signature=YYY&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject
```

### File Sources

Files appear in two contexts:

1. **Database Properties**: Files property type in database records
2. **Content Blocks**: Image blocks, file blocks, video blocks in page content

## Solution Overview

### Design Principles

- **Zero Breaking Changes**: Existing functionality remains unchanged
- **Gradual Adoption**: Optional strategies that users can enable
- **Framework Agnostic**: Works with Next.js, Nuxt, SvelteKit, etc.
- **Layered API Consistency**: Follows existing 3-layer architecture
- **Unified File Handling**: Same strategy for all file types

### Strategy Options

1. **Direct** (Default): Current behavior - use Notion URLs as-is
2. **Cache**: Store files locally or in S3-compatible storage

## Technical Architecture

### Layered API Behavior

#### Simple API Layer

```typescript
// Unchanged - maintains backward compatibility
const record = await notionCMS.getRecord(pageId);
record.imageField; // Always returns original Notion URL
record.attachments; // Always returns original Notion URLs
```

#### Advanced API Layer

```typescript
const record = await notionCMS.getRecord(pageId);

// No config: returns original Notion URLs (fallback)
record.advanced.imageField; // "https://notion-aws-url..."
record.advanced.attachments; // ["https://notion-aws-url...", ...]

// Cache config: returns cached file URLs
record.advanced.imageField; // "/assets/notion-files/abc123.jpg"
record.advanced.attachments; // ["/assets/notion-files/def456.pdf", ...]
```

#### Raw API Layer

```typescript
// Always unchanged - raw Notion response
record.raw.properties.ImageField.files[0].file.url;
record.raw.properties.Attachments.files[0].file.url;
```

### Configuration Interface

```typescript
interface NotionCMSConfig {
  files?: {
    strategy: "direct" | "cache";
    storage?: {
      type: "local" | "s3-compatible";
      // For local storage
      path?: string; // default: "./public/assets/notion-files"
      // For S3-compatible storage
      endpoint?: string;
      bucket?: string;
      accessKey?: string;
      secretKey?: string;
    };
    cache?: {
      ttl: number; // default 24 hours
      maxSize: number; // default 100MB
    };
  };
}
```

### Strategy Details

#### Direct Strategy

- **Storage**: None - uses original Notion URLs
- **Mechanism**: Returns Notion URLs as-is (current behavior)
- **Benefits**: Zero setup, zero cost, zero dependencies
- **Use Case**: Dynamic pages, low-traffic sites, simple development
- **Limitation**: URLs expire after 1 hour on static/ISR pages

#### Cache Strategy

- **Storage**: Files stored locally or in S3-compatible storage
- **Mechanism**:
  1. Detect files in database properties and content blocks
  2. Download files from Notion on first access
  3. Store in configured storage with stable filenames
  4. Return stable URLs pointing to cached files
- **Benefits**: Stable URLs, better performance, CDN-ready
- **Use Case**: Static sites, ISR pages, high-traffic applications

## Implementation Plan

### Phase 1: Foundation (Core Library Changes)

**Goal**: Set up configuration system and file detection

#### Tasks:

- [ ] Add configuration interface to NotionCMS constructor
- [ ] Create FileManager class with strategy pattern
- [ ] Update block processing to detect all file types
- [ ] Update database property processing for file detection
- [ ] Implement 'direct' strategy (current behavior)
- [ ] Add file type detection utilities
- [ ] Write unit tests for configuration system

#### Files to Modify:

- `packages/notion-cms/src/index.ts`
- `packages/notion-cms/src/generator.ts`
- Create: `packages/notion-cms/src/file-manager.ts`
- Create: `packages/notion-cms/src/config.ts`

### Phase 2: Cache Strategy (Local Storage)

**Goal**: Implement local filesystem caching

#### Tasks:

- [ ] Implement local storage interface
- [ ] Create file download utilities
- [ ] Build cache management (TTL, cleanup)
- [ ] Add framework static directory detection
- [ ] Generate stable URLs for cached files
- [ ] Write integration tests

#### Files to Create:

- `packages/notion-cms/src/strategies/cache-strategy.ts`
- `packages/notion-cms/src/storage/local-storage.ts`
- `packages/notion-cms/src/utils/file-utils.ts`

### Phase 3: Cache Strategy (S3-Compatible)

**Goal**: Add S3-compatible storage support

#### Tasks:

- [ ] Implement S3-compatible storage interface
- [ ] Add S3 client utilities
- [ ] Create storage provider examples
- [ ] Performance testing and optimization
- [ ] Memory usage optimization

#### Files to Create:

- `packages/notion-cms/src/storage/s3-storage.ts`
- `examples/s3-storage-setup.ts`

### Phase 4: Documentation & Examples

**Goal**: Complete documentation and real-world examples

#### Tasks:

- [ ] Write or update comprehensive documentation (packages/notion-cms/docs)
- [ ] Create configuration examples

#### Files to Create:

- `docs/guides/file-management.md`
- `examples/file-strategies/`
- `docs/api-reference/file-config.md`

## Configuration Examples

### Zero-Config (Default)

```typescript
const notionCMS = new NotionCMS(token);
// Uses 'direct' strategy - current behavior
// All files return original Notion URLs
```

### Local Cache (Small Sites)

```typescript
const notionCMS = new NotionCMS(token, {
  files: {
    strategy: "cache",
    storage: {
      type: "local",
      path: "./public/assets/notion-files",
    },
  },
});
// Returns: "/assets/notion-files/abc123.jpg"
```

### S3-Compatible Cache (Scalable)

```typescript
const notionCMS = new NotionCMS(token, {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://s3.amazonaws.com",
      bucket: "my-notion-files",
      accessKey: process.env.AWS_ACCESS_KEY,
      secretKey: process.env.AWS_SECRET_KEY,
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 500 * 1024 * 1024, // 500MB
    },
  },
});
// Returns: "https://my-notion-files.s3.amazonaws.com/abc123.pdf"
```

### Vercel Blob Example

```typescript
const notionCMS = new NotionCMS(token, {
  files: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: process.env.BLOB_READ_WRITE_TOKEN,
      bucket: "notion-files",
    },
  },
});
```

## File Processing Pipeline

### Type Generation (CLI Time)

```typescript
// File properties are already detected during type generation in generator.ts:
case "files":
  return "{ name: string; url: string; }[]";  // Current implementation

// No preemptive scanning needed - schema is already known
```

### Runtime Processing (On Record Fetch)

```typescript
// When user calls getRecord() or getPageContent():
export function processNotionRecord(page: PageObjectResponse): DatabaseRecord {
  // Process file properties using existing property processing pipeline:
  if (property.type === "files") {
    const files = property.files;

    if (this.config.files?.strategy === "cache") {
      // Transform URLs on-demand during record processing
      return await Promise.all(
        files.map((file) => this.fileManager.processFileUrl(file.url))
      );
    }

    // Direct strategy: return as-is (current behavior)
    return files.map((file) => file.url);
  }
}
```

### On-Demand File Caching

```typescript
// FileManager processes individual URLs when accessed:
class FileManager {
  async processFileUrl(notionUrl: string): Promise<string> {
    // 1. Generate stable file ID
    const fileId = generateFileId(notionUrl); // "abc123"

    // 2. Determine file extension
    const extension = getFileExtension(notionUrl); // ".jpg"

    // 3. Create stable filename
    const filename = `${fileId}${extension}`; // "abc123.jpg"

    // 4. Check if already cached
    if (await this.storage.exists(filename)) {
      return this.storage.getPublicUrl(filename);
    }

    // 5. Cache on first access
    const fileData = await downloadFile(notionUrl);
    await this.storage.store(filename, fileData);

    return this.storage.getPublicUrl(filename);
  }
}
```

## Storage Structure

### Local Storage (Flat)

```
./public/assets/notion-files/
├── abc123.jpg         # Image file
├── def456.pdf         # PDF document
├── ghi789.mp4         # Video file
├── jkl012.docx        # Word document
└── mno345.zip         # Archive file
```

### S3 Storage (Flat)

```
s3://my-bucket/
├── abc123.jpg
├── def456.pdf
├── ghi789.mp4
└── jkl012.docx
```

## Success Criteria

### Technical Requirements

- [ ] Zero breaking changes to existing API
- [ ] Support for all uploaded file types
- [ ] Support for both database properties and content blocks
- [ ] Framework-agnostic implementation (Next.js, Nuxt, SvelteKit)
- [ ] Minimal dependency footprint
- [ ] Comprehensive test coverage (>90%) (optional)

### Performance Requirements (Out of scope)

- [ ] Cache strategy: <100ms for file download and storage
- [ ] Local storage: <10ms response time for cached files
- [ ] S3 storage: <50ms response time for cached files
- [ ] Memory usage: <20MB additional for file metadata

### User Experience Requirements

- [ ] Works out-of-the-box with zero config
- [ ] Auto-detection of framework static directories
- [ ] Clear error messages for misconfigurations
- [ ] Comprehensive documentation with examples

## Risk Mitigation

### Technical Risks

- **File Conflicts**: Use Notion IDs for stable file IDs since the library will be reading from notion. These can be found in the URL links

### Business Risks

- **Adoption**: Make feature completely optional with sensible defaults
- **Complexity**: Keep simple use cases simple, advanced features optional
- **Maintenance**: Design for minimal ongoing maintenance burden

## Future Enhancements (Out of Scope)

- File optimization (image compression, PDF optimization)
- Responsive image generation
- File analytics and usage metrics
- Advanced caching strategies (LRU, etc.)
- File versioning and updates
- Bulk file migration tools

## Dependencies

### Required

- `@notionhq/client` (existing)
- `node:fs` (built-in, for local storage)
- `node:path` (built-in, for file paths)

### Optional (peer dependencies)

- `@aws-sdk/client-s3` (for S3-compatible storage)
- `@vercel/blob` (for Vercel Blob storage)

## Backward Compatibility

All existing code continues to work without any changes:

```typescript
// Existing code - works unchanged
const notionCMS = new NotionCMS(token);
const record = await notionCMS.getRecord(pageId);
const imageUrl = record.imageField; // Still returns Notion URL
const files = record.attachments; // Still returns Notion URLs

// Content blocks also unchanged
const blocks = await notionCMS.getPageContent(pageId);
// File URLs in blocks remain as original Notion URLs
```

New features are opt-in only, ensuring zero impact on current users while providing powerful new capabilities for those who need them.
