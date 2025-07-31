# Pagination Guide

This guide covers how to effectively handle pagination when working with large datasets in Notion CMS. Understanding pagination is crucial for building performant applications that scale with your data.

## Understanding Notion Pagination

Notion's API uses cursor-based pagination rather than offset-based pagination. This approach is more efficient for large datasets and prevents issues with data consistency during pagination.

### Key Concepts

- **Page Size**: Maximum 100 records per request (Notion API limit)
- **Cursor**: Opaque string that points to a specific position in the dataset
- **hasMore**: Boolean indicating if more records are available
- **nextCursor**: Cursor for the next page (null if no more pages)

## Basic Pagination Patterns

### Manual Pagination

Use `getDatabase()` for manual pagination control:

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!);

async function paginateManually(databaseId: string) {
  let hasMore = true;
  let nextCursor: string | null = null;
  let pageNumber = 1;

  while (hasMore) {
    console.log(`Fetching page ${pageNumber}...`);

    const {
      results,
      hasMore: more,
      nextCursor: cursor,
    } = await notionCms.getDatabase(databaseId, {
      pageSize: 50,
      startCursor: nextCursor,
    });

    console.log(`Page ${pageNumber}: ${results.length} records`);

    // Process the results
    results.forEach((record, index) => {
      console.log(`${pageNumber}.${index + 1}: ${record.Title}`);
    });

    // Update pagination state
    hasMore = more;
    nextCursor = cursor;
    pageNumber++;

    // Add delay to respect rate limits
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
```

### Automatic Pagination

Use `getAllDatabaseRecords()` for automatic pagination:

```typescript
// Automatic pagination - handles everything internally
async function getAllRecords(databaseId: string) {
  console.log("Fetching all records...");

  const allRecords = await notionCms.getAllDatabaseRecords(databaseId);

  console.log(`Total records: ${allRecords.length}`);
  return allRecords;
}
```

## Advanced Pagination Patterns

### Pagination with Filtering

Combine pagination with filters for efficient data retrieval:

```typescript
async function paginateWithFilters(databaseId: string) {
  const filter = {
    property: "Status",
    select: { equals: "Published" },
  };

  let allPublishedPosts = [];
  let hasMore = true;
  let nextCursor: string | null = null;

  while (hasMore) {
    const {
      results,
      hasMore: more,
      nextCursor: cursor,
    } = await notionCms.getDatabase(databaseId, {
      filter,
      pageSize: 25,
      startCursor: nextCursor,
    });

    allPublishedPosts.push(...results);
    hasMore = more;
    nextCursor = cursor;
  }

  return allPublishedPosts;
}
```

### Pagination with Sorting

Maintain consistent ordering across pages:

```typescript
async function paginateWithSorting(databaseId: string) {
  const sorts = [
    { property: "Created Date", direction: "descending" as const },
    { property: "Title", direction: "ascending" as const },
  ];

  let allRecords = [];
  let hasMore = true;
  let nextCursor: string | null = null;

  while (hasMore) {
    const {
      results,
      hasMore: more,
      nextCursor: cursor,
    } = await notionCms.getDatabase(databaseId, {
      sorts,
      pageSize: 50,
      startCursor: nextCursor,
    });

    allRecords.push(...results);
    hasMore = more;
    nextCursor = cursor;
  }

  return allRecords;
}
```

### Query Builder Pagination

Use the Query Builder for type-safe pagination:

```typescript
async function queryBuilderPagination(databaseId: string) {
  // Get first page
  const firstPage = await notionCms
    .query(databaseId)
    .where("Status")
    .equals("Published")
    .sort("Created Date", "descending")
    .paginate(20);

  console.log(`First page: ${firstPage.results.length} records`);
  console.log(`Has more: ${firstPage.hasMore}`);

  // Get all pages automatically
  const allResults = await notionCms
    .query(databaseId)
    .where("Status")
    .equals("Published")
    .sort("Created Date", "descending")
    .all();

  console.log(`Total results: ${allResults.length}`);
  return allResults;
}
```

## Performance Optimization Patterns

### Batch Processing

Process records in batches to optimize memory usage and API calls:

```typescript
class BatchProcessor {
  private batchSize: number;
  private processDelay: number;

  constructor(batchSize: number = 50, processDelay: number = 100) {
    this.batchSize = batchSize;
    this.processDelay = processDelay;
  }

  async processBatches<T>(
    databaseId: string,
    processor: (batch: T[]) => Promise<void>,
    options: {
      filter?: any;
      sorts?: any[];
    } = {}
  ): Promise<void> {
    let hasMore = true;
    let nextCursor: string | null = null;
    let batchNumber = 1;

    while (hasMore) {
      console.log(`Processing batch ${batchNumber}...`);

      const {
        results,
        hasMore: more,
        nextCursor: cursor,
      } = await notionCms.getDatabase(databaseId, {
        ...options,
        pageSize: this.batchSize,
        startCursor: nextCursor,
      });

      // Process the batch
      await processor(results as T[]);

      hasMore = more;
      nextCursor = cursor;
      batchNumber++;

      // Rate limiting delay
      if (hasMore && this.processDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.processDelay));
      }
    }
  }
}

// Usage
const processor = new BatchProcessor(25, 200);

await processor.processBatches(
  "blog-db-id",
  async (batch) => {
    // Process each batch
    for (const post of batch) {
      await processPost(post);
    }
  },
  {
    filter: { property: "Status", select: { equals: "Published" } },
  }
);
```

### Parallel Processing

Process multiple pages concurrently (use with caution for rate limits):

```typescript
async function parallelPagination(databaseId: string, concurrency: number = 3) {
  // First, get the total count and first few pages to understand the dataset
  const firstPage = await notionCms.getDatabase(databaseId, { pageSize: 100 });

  if (!firstPage.hasMore) {
    return firstPage.results;
  }

  // For parallel processing, we need to be careful about rate limits
  // This approach fetches multiple pages concurrently
  const allResults = [...firstPage.results];
  const pagesToFetch = [];

  let currentCursor = firstPage.nextCursor;

  // Collect cursors for parallel fetching (limit to prevent rate limiting)
  for (let i = 0; i < concurrency - 1 && currentCursor; i++) {
    pagesToFetch.push(currentCursor);

    // Get next cursor (this is a simplified approach)
    const nextPage = await notionCms.getDatabase(databaseId, {
      pageSize: 100,
      startCursor: currentCursor,
    });

    allResults.push(...nextPage.results);
    currentCursor = nextPage.nextCursor;

    if (!nextPage.hasMore) break;
  }

  return allResults;
}
```

### Smart Pagination with Caching

Implement intelligent caching for frequently accessed pages:

```typescript
class SmartPaginator {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(databaseId: string, options: any): string {
    return `${databaseId}-${JSON.stringify(options)}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  async getPage(databaseId: string, options: any = {}) {
    const cacheKey = this.getCacheKey(databaseId, options);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log("Cache hit for:", cacheKey);
      return cached.data;
    }

    console.log("Cache miss, fetching:", cacheKey);
    const data = await notionCms.getDatabase(databaseId, options);

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  async getAllWithCache(databaseId: string, options: any = {}) {
    let allResults = [];
    let hasMore = true;
    let nextCursor: string | null = null;

    while (hasMore) {
      const pageOptions = {
        ...options,
        startCursor: nextCursor,
      };

      const {
        results,
        hasMore: more,
        nextCursor: cursor,
      } = await this.getPage(databaseId, pageOptions);

      allResults.push(...results);
      hasMore = more;
      nextCursor = cursor;
    }

    return allResults;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Usage
const paginator = new SmartPaginator();
const results = await paginator.getAllWithCache("database-id", {
  filter: { property: "Status", select: { equals: "Published" } },
});
```

## Real-World Use Cases

### Blog Pagination

Implement blog-style pagination with page numbers:

```typescript
interface BlogPage {
  posts: any[];
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

class BlogPaginator {
  private postsPerPage: number;

  constructor(postsPerPage: number = 10) {
    this.postsPerPage = postsPerPage;
  }

  async getPage(databaseId: string, cursor?: string): Promise<BlogPage> {
    const { results, hasMore, nextCursor } = await notionCms.getDatabase(
      databaseId,
      {
        filter: { property: "Status", select: { equals: "Published" } },
        sorts: [{ property: "Published Date", direction: "descending" }],
        pageSize: this.postsPerPage,
        startCursor: cursor,
      }
    );

    // Note: Cursor-based pagination doesn't provide total count
    // For page numbers, you'd need to maintain a separate count
    return {
      posts: results,
      currentPage: 1, // Would need to track this separately
      totalPages: -1, // Unknown with cursor pagination
      hasNext: hasMore,
      hasPrevious: !!cursor,
      nextCursor: nextCursor || undefined,
    };
  }

  async getAllPages(databaseId: string): Promise<BlogPage[]> {
    const pages: BlogPage[] = [];
    let nextCursor: string | undefined;

    do {
      const page = await this.getPage(databaseId, nextCursor);
      pages.push(page);
      nextCursor = page.nextCursor;
    } while (nextCursor);

    // Update page numbers
    pages.forEach((page, index) => {
      page.currentPage = index + 1;
      page.totalPages = pages.length;
    });

    return pages;
  }
}
```

### Infinite Scroll Implementation

Perfect for modern web applications:

```typescript
class InfiniteScrollLoader {
  private loading = false;
  private allLoaded = false;
  private nextCursor: string | null = null;
  private loadedItems: any[] = [];

  constructor(
    private databaseId: string,
    private pageSize: number = 20,
    private onItemsLoaded: (items: any[]) => void = () => {}
  ) {}

  async loadMore(): Promise<boolean> {
    if (this.loading || this.allLoaded) {
      return false;
    }

    this.loading = true;

    try {
      const { results, hasMore, nextCursor } = await notionCms.getDatabase(
        this.databaseId,
        {
          pageSize: this.pageSize,
          startCursor: this.nextCursor,
          sorts: [{ property: "Created Date", direction: "descending" }],
        }
      );

      this.loadedItems.push(...results);
      this.nextCursor = nextCursor;
      this.allLoaded = !hasMore;

      this.onItemsLoaded(results);

      return true;
    } finally {
      this.loading = false;
    }
  }

  async loadInitial(): Promise<void> {
    this.reset();
    await this.loadMore();
  }

  reset(): void {
    this.loading = false;
    this.allLoaded = false;
    this.nextCursor = null;
    this.loadedItems = [];
  }

  get items(): any[] {
    return this.loadedItems;
  }

  get canLoadMore(): boolean {
    return !this.loading && !this.allLoaded;
  }
}

// Usage in a React component (conceptual)
const loader = new InfiniteScrollLoader("blog-database-id", 15, (newItems) => {
  // Update UI with new items
  console.log(`Loaded ${newItems.length} new items`);
});

// Initial load
await loader.loadInitial();

// Load more when user scrolls
if (loader.canLoadMore) {
  await loader.loadMore();
}
```

### Search with Pagination

Implement search functionality with pagination:

```typescript
class SearchPaginator {
  async search(
    databaseId: string,
    searchTerm: string,
    filters: any = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    // Note: Notion API doesn't support full-text search within database queries
    // This approach filters results client-side (not ideal for large datasets)

    const allResults = await notionCms.getAllDatabaseRecords(databaseId, {
      filter: filters,
    });

    // Client-side search (consider using a proper search solution for production)
    const searchResults = allResults.filter((record) => {
      const searchableText = [
        record.Title,
        record.Content,
        ...(record.Tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm.toLowerCase());
    });

    // Client-side pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageResults = searchResults.slice(startIndex, endIndex);

    return {
      results: pageResults,
      totalResults: searchResults.length,
      currentPage: page,
      totalPages: Math.ceil(searchResults.length / pageSize),
      hasMore: endIndex < searchResults.length,
    };
  }
}
```

## Error Handling and Recovery

### Robust Pagination with Error Recovery

```typescript
class RobustPaginator {
  async getAllWithRetry(
    databaseId: string,
    options: any = {},
    maxRetries: number = 3
  ) {
    let allResults = [];
    let hasMore = true;
    let nextCursor: string | null = null;
    let retryCount = 0;

    while (hasMore) {
      try {
        const {
          results,
          hasMore: more,
          nextCursor: cursor,
        } = await notionCms.getDatabase(databaseId, {
          ...options,
          startCursor: nextCursor,
        });

        allResults.push(...results);
        hasMore = more;
        nextCursor = cursor;
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error(`Pagination error:`, error);

        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms... (attempt ${retryCount})`);

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          console.error(`Max retries (${maxRetries}) exceeded`);
          throw error;
        }
      }
    }

    return allResults;
  }
}
```

## Best Practices

### 1. Choose the Right Pagination Method

```typescript
// ✅ For small datasets (< 1000 records)
const allRecords = await notionCms.getAllDatabaseRecords(databaseId);

// ✅ For large datasets or when you need control
const { results, hasMore, nextCursor } = await notionCms.getDatabase(
  databaseId,
  {
    pageSize: 50,
  }
);

// ✅ For type-safe queries
const results = await notionCms.query(databaseId).paginate(25);
```

### 2. Implement Rate Limiting

```typescript
// Add delays between requests to respect Notion's rate limits
async function respectRateLimits(delay: number = 150) {
  await new Promise((resolve) => setTimeout(resolve, delay));
}
```

### 3. Use Appropriate Page Sizes

```typescript
// ✅ Good page sizes for different use cases
const sizes = {
  ui: 20, // Good for user interfaces
  processing: 50, // Balance between API calls and memory
  bulk: 100, // Maximum allowed by Notion API
};
```

### 4. Handle Empty Results

```typescript
async function safelyGetRecords(databaseId: string) {
  const { results, hasMore, nextCursor } = await notionCms.getDatabase(
    databaseId
  );

  if (results.length === 0) {
    console.log("No records found");
    return { results: [], hasMore: false, nextCursor: null };
  }

  return { results, hasMore, nextCursor };
}
```

### 5. Monitor Performance

```typescript
async function monitoredPagination(databaseId: string) {
  const startTime = Date.now();
  let totalRecords = 0;
  let pageCount = 0;

  let hasMore = true;
  let nextCursor: string | null = null;

  while (hasMore) {
    const pageStart = Date.now();

    const {
      results,
      hasMore: more,
      nextCursor: cursor,
    } = await notionCms.getDatabase(databaseId, {
      pageSize: 50,
      startCursor: nextCursor,
    });

    const pageTime = Date.now() - pageStart;
    totalRecords += results.length;
    pageCount++;

    console.log(
      `Page ${pageCount}: ${results.length} records in ${pageTime}ms`
    );

    hasMore = more;
    nextCursor = cursor;
  }

  const totalTime = Date.now() - startTime;
  console.log(
    `Total: ${totalRecords} records in ${pageCount} pages, ${totalTime}ms`
  );
  console.log(`Average: ${(totalTime / pageCount).toFixed(2)}ms per page`);
}
```

## Related Documentation

- **[Database Operations](../api-reference/database-operations.md)** - Core database methods with pagination support
- **[Query Builder](../api-reference/query-builder.md)** - Type-safe queries with pagination methods
- **[Error Handling](./error-handling.md)** - Handling pagination errors and recovery strategies
