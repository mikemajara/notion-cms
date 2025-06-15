# Basic Usage Examples

This guide provides practical examples for common Notion CMS operations. These examples demonstrate how to perform basic database operations, handle different property types, and implement common patterns.

## Setup

All examples assume you have Notion CMS initialized:

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!);

// Example database IDs (replace with your own)
const BLOG_DB_ID = "your-blog-database-id";
const TASKS_DB_ID = "your-tasks-database-id";
const CONTACTS_DB_ID = "your-contacts-database-id";
```

## Database Operations

### Getting All Records

```typescript
// Get all records from a database
async function getAllBlogPosts() {
  try {
    const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

    console.log(`Found ${posts.length} blog posts`);

    posts.forEach((post) => {
      console.log(`- ${post.Title} (${post.Status})`);
    });

    return posts;
  } catch (error) {
    console.error("Failed to fetch blog posts:", error.message);
    return [];
  }
}
```

### Getting Records with Pagination

```typescript
// Get records page by page
async function getPostsWithPagination() {
  let allPosts = [];
  let hasMore = true;
  let nextCursor = null;
  let pageNum = 1;

  while (hasMore) {
    console.log(`Fetching page ${pageNum}...`);

    const {
      results,
      hasMore: more,
      nextCursor: cursor,
    } = await notionCms.getDatabase(BLOG_DB_ID, {
      pageSize: 10,
      startCursor: nextCursor,
    });

    allPosts.push(...results);
    hasMore = more;
    nextCursor = cursor;
    pageNum++;

    console.log(`Page ${pageNum - 1}: ${results.length} posts`);
  }

  console.log(`Total: ${allPosts.length} posts`);
  return allPosts;
}
```

### Getting a Single Record

```typescript
// Get a single record by ID
async function getBlogPost(pageId: string) {
  try {
    const post = await notionCms.getRecord(pageId);

    console.log("Post details:");
    console.log(`Title: ${post.Title}`);
    console.log(`Status: ${post.Status}`);
    console.log(`Tags: ${post.Tags?.join(", ") || "None"}`);
    console.log(
      `Published: ${post.PublishDate?.toLocaleDateString() || "Not published"}`
    );

    return post;
  } catch (error) {
    console.error("Failed to fetch post:", error.message);
    return null;
  }
}
```

## Working with Properties

### Text and Rich Text Properties

```typescript
// Handle different text property types
async function processTextProperties() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  posts.forEach((post) => {
    // Title property (always a string)
    const title = post.Title || "Untitled";
    console.log(`Title: ${title}`);

    // Rich text content (simplified to string)
    const content = post.Content || "";
    const excerpt =
      content.length > 100 ? content.substring(0, 100) + "..." : content;
    console.log(`Excerpt: ${excerpt}`);

    // Access rich formatting if needed
    if (post.advanced?.Content) {
      const hasFormatting = post.advanced.Content.some((text) =>
        Object.values(text.annotations || {}).some(Boolean)
      );
      console.log(`Has formatting: ${hasFormatting}`);
    }
  });
}
```

### Date Properties

```typescript
// Working with date properties
async function analyzeDates() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  // Filter posts by date
  const publishedPosts = posts.filter((post) => post.PublishDate);
  const draftPosts = posts.filter((post) => !post.PublishDate);

  console.log(`Published: ${publishedPosts.length}`);
  console.log(`Drafts: ${draftPosts.length}`);

  // Find recent posts (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPosts = publishedPosts.filter(
    (post) => post.PublishDate && post.PublishDate > thirtyDaysAgo
  );

  console.log(`Recent posts (last 30 days): ${recentPosts.length}`);

  // Sort by publish date
  const sortedPosts = publishedPosts.sort((a, b) => {
    const dateA = a.PublishDate?.getTime() || 0;
    const dateB = b.PublishDate?.getTime() || 0;
    return dateB - dateA; // Newest first
  });

  console.log("Latest posts:");
  sortedPosts.slice(0, 5).forEach((post) => {
    console.log(`- ${post.Title} (${post.PublishDate?.toLocaleDateString()})`);
  });
}
```

### Select and Multi-Select Properties

```typescript
// Working with select properties
async function analyzeSelectProperties() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  // Analyze status distribution
  const statusCounts = new Map();
  posts.forEach((post) => {
    const status = post.Status || "Unknown";
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  console.log("Status distribution:");
  statusCounts.forEach((count, status) => {
    console.log(`  ${status}: ${count}`);
  });

  // Analyze tags (multi-select)
  const tagCounts = new Map();
  posts.forEach((post) => {
    if (post.Tags && Array.isArray(post.Tags)) {
      post.Tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });

  console.log("\nMost popular tags:");
  const sortedTags = Array.from(tagCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  sortedTags.forEach(([tag, count]) => {
    console.log(`  ${tag}: ${count} posts`);
  });

  // Find posts with specific tags
  const reactPosts = posts.filter((post) => post.Tags?.includes("React"));
  console.log(`\nPosts tagged with "React": ${reactPosts.length}`);
}
```

### Number Properties

```typescript
// Working with number properties
async function analyzeNumbers() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  // Calculate statistics for numeric properties
  const priorities = posts
    .map((post) => post.Priority)
    .filter((priority) => typeof priority === "number");

  if (priorities.length > 0) {
    const avg = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
    const min = Math.min(...priorities);
    const max = Math.max(...priorities);

    console.log("Priority statistics:");
    console.log(`  Average: ${avg.toFixed(2)}`);
    console.log(`  Min: ${min}`);
    console.log(`  Max: ${max}`);

    // Group by priority levels
    const lowPriority = posts.filter((p) => p.Priority && p.Priority <= 3);
    const mediumPriority = posts.filter(
      (p) => p.Priority && p.Priority > 3 && p.Priority <= 7
    );
    const highPriority = posts.filter((p) => p.Priority && p.Priority > 7);

    console.log(`\nPriority distribution:`);
    console.log(`  Low (1-3): ${lowPriority.length}`);
    console.log(`  Medium (4-7): ${mediumPriority.length}`);
    console.log(`  High (8-10): ${highPriority.length}`);
  }
}
```

### People Properties

```typescript
// Working with people properties
async function analyzePeople() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  // Count posts by author
  const authorCounts = new Map();
  posts.forEach((post) => {
    if (post.Author && Array.isArray(post.Author)) {
      post.Author.forEach((author) => {
        authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
      });
    }
  });

  console.log("Posts by author:");
  authorCounts.forEach((count, author) => {
    console.log(`  ${author}: ${count} posts`);
  });

  // Find posts without authors
  const postsWithoutAuthor = posts.filter(
    (post) => !post.Author || post.Author.length === 0
  );
  console.log(`\nPosts without author: ${postsWithoutAuthor.length}`);

  // Get author details from advanced API
  const postsWithAuthorDetails = posts.filter(
    (post) => post.advanced?.Author && post.advanced.Author.length > 0
  );

  console.log("\nAuthor details (advanced):");
  postsWithAuthorDetails.slice(0, 3).forEach((post) => {
    post.advanced.Author.forEach((author) => {
      console.log(`  ${author.name} (${author.person?.email || "no email"})`);
    });
  });
}
```

### URL and Email Properties

```typescript
// Working with URL and email properties
async function analyzeContactInfo() {
  const contacts = await notionCms.getAllDatabaseRecords(CONTACTS_DB_ID);

  // Validate URLs
  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validate emails
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Analyze contact data quality
  const analysis = {
    total: contacts.length,
    withWebsite: 0,
    withValidWebsite: 0,
    withEmail: 0,
    withValidEmail: 0,
  };

  contacts.forEach((contact) => {
    if (contact.Website) {
      analysis.withWebsite++;
      if (isValidUrl(contact.Website)) {
        analysis.withValidWebsite++;
      }
    }

    if (contact.Email) {
      analysis.withEmail++;
      if (isValidEmail(contact.Email)) {
        analysis.withValidEmail++;
      }
    }
  });

  console.log("Contact data analysis:");
  console.log(`  Total contacts: ${analysis.total}`);
  console.log(
    `  With website: ${analysis.withWebsite} (${(
      (analysis.withWebsite / analysis.total) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`  Valid websites: ${analysis.withValidWebsite}`);
  console.log(
    `  With email: ${analysis.withEmail} (${(
      (analysis.withEmail / analysis.total) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`  Valid emails: ${analysis.withValidEmail}`);
}
```

## Query Building

### Simple Filters

```typescript
// Basic filtering examples
async function basicFiltering() {
  // Get published posts
  const publishedPosts = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Published")
    .execute();

  console.log(`Published posts: ${publishedPosts.length}`);

  // Get high priority tasks
  const highPriorityTasks = await notionCms
    .query(TASKS_DB_ID)
    .where("Priority")
    .greaterThan(7)
    .execute();

  console.log(`High priority tasks: ${highPriorityTasks.length}`);

  // Get posts with specific tag
  const reactPosts = await notionCms
    .query(BLOG_DB_ID)
    .where("Tags")
    .contains("React")
    .execute();

  console.log(`React posts: ${reactPosts.length}`);

  // Get recent posts
  const recentPosts = await notionCms
    .query(BLOG_DB_ID)
    .where("Created Date")
    .onOrAfter(new Date("2024-01-01"))
    .execute();

  console.log(`Posts since 2024: ${recentPosts.length}`);
}
```

### Complex Filters

```typescript
// Complex filtering with AND/OR logic
async function complexFiltering() {
  // Published posts with high priority OR urgent tag
  const importantPosts = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Published")
    .and((builder) =>
      builder.where("Priority").greaterThan(8).or("Tags").contains("Urgent")
    )
    .execute();

  console.log(`Important posts: ${importantPosts.length}`);

  // Tasks assigned to me that are not completed
  const myTasks = await notionCms
    .query(TASKS_DB_ID)
    .where("Assignee")
    .contains("Your Name")
    .where("Completed")
    .equals(false)
    .execute();

  console.log(`My pending tasks: ${myTasks.length}`);

  // Posts published this year with React OR TypeScript tags
  const techPosts = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Published")
    .where("Publish Date")
    .onOrAfter(new Date("2024-01-01"))
    .and((builder) =>
      builder.where("Tags").contains("React").or("Tags").contains("TypeScript")
    )
    .execute();

  console.log(`Tech posts this year: ${techPosts.length}`);
}
```

### Sorting and Pagination

```typescript
// Sorting and pagination examples
async function sortingAndPagination() {
  // Get latest 10 published posts
  const latestPosts = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Published")
    .sort("Publish Date", "descending")
    .paginate(10);

  console.log("Latest posts:");
  latestPosts.results.forEach((post) => {
    console.log(`- ${post.Title} (${post.PublishDate?.toLocaleDateString()})`);
  });

  // Get all posts sorted by title
  const allPostsSorted = await notionCms
    .query(BLOG_DB_ID)
    .sort("Title", "ascending")
    .all();

  console.log(`\nAll posts sorted by title: ${allPostsSorted.length}`);

  // Multi-level sorting: priority desc, then title asc
  const sortedTasks = await notionCms
    .query(TASKS_DB_ID)
    .sort("Priority", "descending")
    .sort("Title", "ascending")
    .execute();

  console.log(`\nSorted tasks: ${sortedTasks.length}`);
}
```

## Data Processing

### Creating Summaries

```typescript
// Create data summaries
async function createBlogSummary() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  const summary = {
    total: posts.length,
    published: posts.filter((p) => p.Status === "Published").length,
    draft: posts.filter((p) => p.Status === "Draft").length,
    archived: posts.filter((p) => p.Status === "Archived").length,
    withDates: posts.filter((p) => p.PublishDate).length,
    avgPriority: 0,
    topTags: [] as string[],
    oldestPost: null as any,
    newestPost: null as any,
  };

  // Calculate average priority
  const priorities = posts
    .map((p) => p.Priority)
    .filter((p): p is number => typeof p === "number");

  if (priorities.length > 0) {
    summary.avgPriority =
      priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
  }

  // Get top tags
  const tagCounts = new Map<string, number>();
  posts.forEach((post) => {
    post.Tags?.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  summary.topTags = Array.from(tagCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  // Find oldest and newest posts
  const postsWithDates = posts.filter((p) => p.PublishDate);
  if (postsWithDates.length > 0) {
    summary.oldestPost = postsWithDates.reduce((oldest, post) =>
      post.PublishDate! < oldest.PublishDate! ? post : oldest
    );

    summary.newestPost = postsWithDates.reduce((newest, post) =>
      post.PublishDate! > newest.PublishDate! ? post : newest
    );
  }

  console.log("Blog Summary:");
  console.log(`  Total posts: ${summary.total}`);
  console.log(`  Published: ${summary.published}`);
  console.log(`  Drafts: ${summary.draft}`);
  console.log(`  Archived: ${summary.archived}`);
  console.log(`  With publish dates: ${summary.withDates}`);
  console.log(`  Average priority: ${summary.avgPriority.toFixed(2)}`);
  console.log(`  Top tags: ${summary.topTags.join(", ")}`);

  if (summary.oldestPost) {
    console.log(
      `  Oldest post: ${
        summary.oldestPost.Title
      } (${summary.oldestPost.PublishDate.toLocaleDateString()})`
    );
  }

  if (summary.newestPost) {
    console.log(
      `  Newest post: ${
        summary.newestPost.Title
      } (${summary.newestPost.PublishDate.toLocaleDateString()})`
    );
  }

  return summary;
}
```

### Data Export

```typescript
// Export data to different formats
async function exportBlogData() {
  const posts = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Published")
    .sort("Publish Date", "descending")
    .all();

  // Export to CSV
  function exportToCSV(data: any[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((item) =>
      Object.values(item)
        .map((value) => {
          if (value instanceof Date) return value.toISOString();
          if (Array.isArray(value)) return `"${value.join("; ")}"`;
          if (typeof value === "string" && value.includes(","))
            return `"${value}"`;
          return value || "";
        })
        .join(",")
    );

    return [headers, ...rows].join("\n");
  }

  // Export to JSON
  function exportToJSON(data: any[]): string {
    return JSON.stringify(
      data.map((post) => ({
        id: post.id,
        title: post.Title,
        status: post.Status,
        tags: post.Tags || [],
        publishDate: post.PublishDate?.toISOString() || null,
        priority: post.Priority || null,
        content: post.Content || "",
      })),
      null,
      2
    );
  }

  // Export to Markdown
  function exportToMarkdown(data: any[]): string {
    return data
      .map((post) => {
        const date = post.PublishDate
          ? post.PublishDate.toLocaleDateString()
          : "No date";
        const tags = post.Tags ? `Tags: ${post.Tags.join(", ")}` : "";

        return `# ${post.Title}

**Published:** ${date}  
**Status:** ${post.Status}  
${tags}

${post.Content || "No content available"}

---
`;
      })
      .join("\n");
  }

  const csvData = exportToCSV(posts);
  const jsonData = exportToJSON(posts);
  const markdownData = exportToMarkdown(posts);

  console.log("Data exported in multiple formats:");
  console.log(`CSV size: ${csvData.length} characters`);
  console.log(`JSON size: ${jsonData.length} characters`);
  console.log(`Markdown size: ${markdownData.length} characters`);

  return { csvData, jsonData, markdownData };
}
```

## Error Handling

### Basic Error Handling

```typescript
// Handle common errors gracefully
async function safeDataFetching(databaseId: string) {
  try {
    const records = await notionCms.getAllDatabaseRecords(databaseId);
    console.log(`Successfully fetched ${records.length} records`);
    return records;
  } catch (error) {
    console.error("Error fetching data:", error.message);

    // Handle specific error types
    if (error.message.includes("database_id")) {
      console.error("Invalid database ID provided");
    } else if (error.message.includes("unauthorized")) {
      console.error("Check your API key and database permissions");
    } else if (error.message.includes("rate")) {
      console.error("Rate limited - try again later");
    }

    return []; // Return empty array as fallback
  }
}
```

### Retry Logic

```typescript
// Implement retry logic for resilient operations
async function robustDataFetching(databaseId: string, maxRetries = 3) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to fetch data...`);

      const records = await notionCms.getAllDatabaseRecords(databaseId);
      console.log(`Success on attempt ${attempt}`);
      return records;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed: ${error.message}`);

      // Don't retry on certain errors
      if (
        error.message.includes("unauthorized") ||
        error.message.includes("database_id")
      ) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}
```

## Usage Examples

### Blog Management

```typescript
// Complete blog management example
async function manageBlog() {
  console.log("Blog Management System");
  console.log("=====================");

  // Get blog summary
  const summary = await createBlogSummary();

  // Show drafts that need attention
  const drafts = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Draft")
    .sort("Created Date", "ascending")
    .execute();

  console.log(`\nDrafts needing attention (${drafts.length}):`);
  drafts.slice(0, 5).forEach((draft) => {
    const createdDays = draft.CreatedDate
      ? Math.floor(
          (Date.now() - draft.CreatedDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : "unknown";
    console.log(`  - ${draft.Title} (${createdDays} days old)`);
  });

  // Show popular content
  const popular = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Published")
    .where("Priority")
    .greaterThan(8)
    .sort("Priority", "descending")
    .execute();

  console.log(`\nHigh priority content (${popular.length}):`);
  popular.slice(0, 5).forEach((post) => {
    console.log(`  - ${post.Title} (Priority: ${post.Priority})`);
  });
}
```

### Task Management

```typescript
// Task management dashboard
async function taskDashboard() {
  console.log("Task Dashboard");
  console.log("==============");

  // Get task overview
  const allTasks = await notionCms.getAllDatabaseRecords(TASKS_DB_ID);

  const taskStats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.Completed).length,
    pending: allTasks.filter((t) => !t.Completed).length,
    overdue: allTasks.filter(
      (t) => t.DueDate && t.DueDate < new Date() && !t.Completed
    ).length,
    highPriority: allTasks.filter(
      (t) => t.Priority && t.Priority > 7 && !t.Completed
    ).length,
  };

  console.log(`Total tasks: ${taskStats.total}`);
  console.log(`Completed: ${taskStats.completed}`);
  console.log(`Pending: ${taskStats.pending}`);
  console.log(`Overdue: ${taskStats.overdue}`);
  console.log(`High priority: ${taskStats.highPriority}`);

  // Show urgent tasks
  const urgentTasks = await notionCms
    .query(TASKS_DB_ID)
    .where("Completed")
    .equals(false)
    .and((builder) =>
      builder.where("Priority").greaterThan(8).or("Tags").contains("Urgent")
    )
    .sort("Priority", "descending")
    .execute();

  console.log(`\nUrgent tasks (${urgentTasks.length}):`);
  urgentTasks.slice(0, 10).forEach((task) => {
    const dueDate = task.DueDate
      ? task.DueDate.toLocaleDateString()
      : "No due date";
    console.log(`  - ${task.Title} (${dueDate}, Priority: ${task.Priority})`);
  });
}
```

## Running the Examples

To run these examples in your project:

1. **Set up environment variables:**

   ```bash
   # .env
   NOTION_API_KEY=your_notion_api_key
   ```

2. **Replace database IDs with your own:**

   ```typescript
   const BLOG_DB_ID = "your-actual-blog-database-id";
   const TASKS_DB_ID = "your-actual-tasks-database-id";
   ```

3. **Run individual examples:**

   ```typescript
   // Run a specific example
   getAllBlogPosts().then(console.log).catch(console.error);

   // Or run multiple examples
   async function runExamples() {
     await getAllBlogPosts();
     await analyzeDates();
     await basicFiltering();
     await createBlogSummary();
   }

   runExamples();
   ```

## Next Steps

- **[Advanced Queries](./advanced-queries.md)** - Complex filtering and query patterns
- **[Layered API Examples](./layered-api-examples.md)** - Using Simple, Advanced, and Raw APIs
- **[Real-World Use Cases](./real-world-use-cases.md)** - Complete application examples
