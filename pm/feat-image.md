# Image Handling Feature - PRD

## Problem Statement

### Current Issues

Notion API returns image URLs with **1-hour expiration**, causing critical problems:

1. **URL Expiration**: Images break after 1 hour on static pages with long revalidation periods
2. **Performance**: Every image request goes directly to Notion's AWS S3 (no caching)
3. **Reliability**: No fallback mechanism when Notion infrastructure is down
4. **SEO**: External AWS URLs with query parameters aren't optimal for SEO
5. **Cost**: Bandwidth costs scale directly with usage (no optimization)

### Example Problematic URL

```
https://prod-files-secure.s3.us-west-2.amazonaws.com/820e5dee-1891-4687-9f50-66fbd9c6eace/feefeb87-6c5b-4d0e-b820-c050524ea83e/team-nocoloco-aFbs3cwlpZI-unsplash.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600&...
```

## Solution Overview

### Design Principles

- **Zero Breaking Changes**: Existing functionality remains unchanged
- **Gradual Adoption**: Optional strategies that users can enable
- **Framework Agnostic**: Works with Next.js, Nuxt, SvelteKit, etc.
- **Layered API Consistency**: Follows existing 3-layer architecture

### Strategy Options

1. **Direct** (Default): Current behavior - use Notion URLs as-is
2. **Proxy**: Transform URLs to stable endpoints that auto-refresh
3. **Cache**: Store images in S3-compatible storage for persistence

## Technical Architecture

### Layered API Behavior

#### Simple API Layer

```typescript
// Unchanged - maintains backward compatibility
const record = await notionCMS.getRecord(pageId);
record.imageField; // Always returns original Notion URL
```

#### Advanced API Layer

```typescript
const record = await notionCMS.getRecord(pageId);

// No config: returns original Notion URL (fallback)
record.advanced.imageField; // "https://notion-aws-url..."

// Proxy config: returns stable proxy URL
record.advanced.imageField; // "https://yourapp.com/api/notion-image/abc123"

// Cache config: returns cached image URL
record.advanced.imageField; // "https://your-s3-bucket.com/cached-image.jpg"
```

#### Raw API Layer

```typescript
// Always unchanged - raw Notion response
record.raw.properties.ImageField.files[0].file.url;
```

### Configuration Interface

```typescript
interface NotionCMSConfig {
  images?: {
    strategy: "direct" | "proxy" | "cache";
    storage?: {
      type: "s3-compatible";
      endpoint: string;
      bucket: string;
      accessKey: string;
      secretKey: string;
    };
    cache?: {
      ttl: number; // default 24 hours
      maxSize: number; // default 100MB
    };
    proxy?: {
      baseUrl: string; // for custom proxy endpoints
    };
  };
}
```

### Strategy Details

#### Proxy Strategy

- **Storage**: None (only URL metadata in memory/Redis/DB)
- **Mechanism**:
  1. Generate stable proxy URLs from Notion URLs
  2. Store URL mapping with expiry metadata
  3. Auto-refresh expired URLs via Notion API calls
  4. Proxy image requests to current valid URLs
- **Benefits**: Zero external storage, immediate stability
- **Use Case**: Small to medium sites wanting URL stability

#### Cache Strategy

- **Storage**: Full image files in S3-compatible storage
- **Mechanism**:
  1. Download images from Notion on first access
  2. Store in configured S3-compatible storage
  3. Serve from cached storage with CDN-friendly URLs
  4. Background sync for expired/updated images
- **Benefits**: Best performance, full control, CDN-ready
- **Use Case**: High-traffic sites needing maximum performance

## Implementation Plan

### Phase 1: Foundation (Core Library Changes)

**Goal**: Set up configuration system and basic infrastructure

#### Tasks:

- [ ] Add configuration interface to NotionCMS constructor
- [ ] Create ImageManager class with strategy pattern
- [ ] Update block processing to use ImageManager
- [ ] Implement 'direct' strategy (current behavior)
- [ ] Add image URL detection and metadata extraction
- [ ] Write unit tests for configuration system

#### Files to Modify:

- `packages/notion-cms/src/index.ts`
- `packages/notion-cms/src/generator.ts`
- Create: `packages/notion-cms/src/image-manager.ts`
- Create: `packages/notion-cms/src/config.ts`

### Phase 2: Proxy Strategy

**Goal**: Implement URL transformation and auto-refresh mechanism

#### Tasks:

- [ ] Implement proxy URL generation
- [ ] Create URL metadata storage interface
- [ ] Build URL expiry detection logic
- [ ] Implement Notion API URL refresh mechanism
- [ ] Add proxy request handler utilities
- [ ] Create example API route for Next.js
- [ ] Write integration tests

#### Files to Create:

- `packages/notion-cms/src/strategies/proxy-strategy.ts`
- `packages/notion-cms/src/storage/url-storage.ts`
- `examples/nextjs-proxy-api.ts`

### Phase 3: Cache Strategy

**Goal**: Full image caching with S3-compatible storage

#### Tasks:

- [ ] Implement S3-compatible storage interface
- [ ] Create image download and processing utilities
- [ ] Build cache management (TTL, cleanup)
- [ ] Implement background sync service
- [ ] Add image optimization hooks
- [ ] Create storage provider examples
- [ ] Performance testing and optimization

#### Files to Create:

- `packages/notion-cms/src/strategies/cache-strategy.ts`
- `packages/notion-cms/src/storage/s3-storage.ts`
- `packages/notion-cms/src/background/sync-service.ts`

### Phase 4: Documentation & Examples

**Goal**: Complete documentation and real-world examples

#### Tasks:

- [ ] Write comprehensive documentation
- [ ] Create configuration examples
- [ ] Build demo applications
- [ ] Performance benchmarks
- [ ] Migration guides
- [ ] Video tutorials

#### Files to Create:

- `docs/guides/image-handling.md`
- `examples/image-strategies/`
- `docs/api-reference/image-config.md`

## Configuration Examples

### Zero-Config (Default)

```typescript
const notionCMS = new NotionCMS(token);
// Uses 'direct' strategy - current behavior
```

### Proxy Strategy

```typescript
const notionCMS = new NotionCMS(token, {
  images: {
    strategy: "proxy",
    // Uses built-in proxy with auto URL refresh
  },
});
```

### Cache with Vercel Blob

```typescript
const notionCMS = new NotionCMS(token, {
  images: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: process.env.BLOB_READ_WRITE_TOKEN,
      bucket: "notion-images",
    },
  },
});
```

### Cache with Custom S3

```typescript
const notionCMS = new NotionCMS(token, {
  images: {
    strategy: "cache",
    storage: {
      type: "s3-compatible",
      endpoint: "https://s3.amazonaws.com",
      bucket: "my-notion-images",
      accessKey: process.env.AWS_ACCESS_KEY,
      secretKey: process.env.AWS_SECRET_KEY,
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100 * 1024 * 1024, // 100MB
    },
  },
});
```

## Success Criteria

### Technical Requirements

- [ ] Zero breaking changes to existing API
- [ ] Support for all 3 strategies (direct, proxy, cache)
- [ ] Automatic URL refresh for expired Notion URLs
- [ ] Framework-agnostic implementation
- [ ] Minimal dependency footprint
- [ ] Comprehensive test coverage (>90%)

### Performance Requirements

- [ ] Proxy strategy: <50ms overhead per image request
- [ ] Cache strategy: <10ms response time for cached images
- [ ] Background sync: <5% CPU usage during sync
- [ ] Memory usage: <10MB additional for URL metadata

### User Experience Requirements

- [ ] Configuration in <5 lines of code
- [ ] Works out-of-the-box with zero config
- [ ] Clear error messages for misconfigurations
- [ ] Comprehensive documentation with examples
- [ ] Migration path from existing implementations

## Risk Mitigation

### Technical Risks

- **Notion API Rate Limits**: Implement exponential backoff and caching
- **Storage Costs**: Provide size limits and cleanup utilities
- **Memory Leaks**: Implement proper cache eviction policies
- **Breaking Changes**: Extensive testing and gradual rollout

### Business Risks

- **Adoption**: Make feature completely optional with sensible defaults
- **Complexity**: Keep simple use cases simple, advanced features optional
- **Maintenance**: Design for minimal ongoing maintenance burden

## Future Enhancements (Out of Scope)

- Image optimization (WebP, AVIF conversion)
- Responsive image generation
- CDN integration helpers
- Advanced caching strategies (LRU, etc.)
- Image analytics and metrics
- Bulk image migration tools

## Dependencies

### Required

- `@notionhq/client` (existing)
- `node:crypto` (built-in, for URL ID generation)

### Optional (peer dependencies)

- `aws-sdk` (for S3-compatible storage)
- `redis` (for distributed URL metadata storage)
- `sharp` (for future image optimization features)

## Backward Compatibility

All existing code continues to work without any changes:

```typescript
// Existing code - works unchanged
const notionCMS = new NotionCMS(token);
const record = await notionCMS.getRecord(pageId);
const imageUrl = record.imageField; // Still returns Notion URL
```

New features are opt-in only, ensuring zero impact on current users while providing powerful new capabilities for those who need them.
