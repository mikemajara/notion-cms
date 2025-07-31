# Working with Properties

This guide covers how to work with all Notion property types across the three API layers (Simple, Advanced, and Raw). Understanding property handling is crucial for effective use of Notion CMS.

## Overview

Notion CMS provides three ways to access property data:

1. **Simple API** - Clean JavaScript types for easy development
2. **Advanced API** - Rich metadata with formatting and styling information
3. **Raw API** - Complete unmodified Notion API response

## Property Types Guide

### Title Properties

Title properties are the primary identifier for database records.

#### Simple API

```typescript
const record = results[0];
console.log(record.Title); // "My Page Title"
console.log(typeof record.Title); // "string"
```

#### Advanced API

```typescript
console.log(record.advanced.Title);
// [
//   {
//     type: "text",
//     text: { content: "My Page Title", link: null },
//     annotations: { bold: false, italic: false, ... },
//     plain_text: "My Page Title",
//     href: null
//   }
// ]
```

#### Raw API

```typescript
console.log(record.raw.properties.Title);
// {
//   id: "title",
//   type: "title",
//   title: [{ ... }] // Full Notion API response
// }
```

#### Working with Title Properties

```typescript
// Extract plain text from advanced format
function getTitleText(titleProperty: any[]): string {
  return titleProperty.map((item) => item.plain_text).join("");
}

// Create URL-friendly slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .trim();
}

// Usage
const post = results[0];
const slug = createSlug(post.Title);
console.log(slug); // "my-page-title"
```

### Rich Text Properties

Rich text properties contain formatted text with styling and links.

#### Simple API

```typescript
console.log(record.Content); // "This is **bold** and *italic* text."
```

#### Advanced API

```typescript
console.log(record.advanced.Content);
// [
//   { type: "text", text: { content: "This is " }, annotations: {...} },
//   { type: "text", text: { content: "bold" }, annotations: { bold: true, ...} },
//   { type: "text", text: { content: " and " }, annotations: {...} },
//   { type: "text", text: { content: "italic" }, annotations: { italic: true, ...} },
//   { type: "text", text: { content: " text." }, annotations: {...} }
// ]
```

#### Working with Rich Text

```typescript
// Convert rich text to HTML
function richTextToHtml(richText: any[]): string {
  return richText
    .map((item) => {
      let text = item.plain_text;
      const { annotations } = item;

      if (annotations.bold) text = `<strong>${text}</strong>`;
      if (annotations.italic) text = `<em>${text}</em>`;
      if (annotations.strikethrough) text = `<del>${text}</del>`;
      if (annotations.underline) text = `<u>${text}</u>`;
      if (annotations.code) text = `<code>${text}</code>`;

      if (item.href) text = `<a href="${item.href}">${text}</a>`;

      return text;
    })
    .join("");
}

// Convert rich text to Markdown
function richTextToMarkdown(richText: any[]): string {
  return richText
    .map((item) => {
      let text = item.plain_text;
      const { annotations } = item;

      if (annotations.bold) text = `**${text}**`;
      if (annotations.italic) text = `*${text}*`;
      if (annotations.strikethrough) text = `~~${text}~~`;
      if (annotations.code) text = `\`${text}\``;

      if (item.href) text = `[${text}](${item.href})`;

      return text;
    })
    .join("");
}

// Usage
const content = record.advanced.Content;
const htmlContent = richTextToHtml(content);
const markdownContent = richTextToMarkdown(content);
```

### Number Properties

Number properties store numeric values.

#### Simple API

```typescript
console.log(record.Priority); // 5
console.log(record.Price); // 29.99
console.log(typeof record.Priority); // "number"
```

#### Advanced API

```typescript
console.log(record.advanced.Priority); // 5 (same as simple)
console.log(record.advanced.Price); // 29.99 or null if empty
```

#### Working with Numbers

```typescript
// Safe number operations with null checking
function formatPrice(price: number | null): string {
  if (price === null || price === undefined) {
    return "Price not set";
  }
  return `$${price.toFixed(2)}`;
}

// Calculate totals
function calculateTotal(records: any[]): number {
  return records.reduce((sum, record) => {
    const price = record.Price || 0;
    return sum + price;
  }, 0);
}

// Format priority levels
function formatPriority(priority: number | null): string {
  if (priority === null) return "No priority";
  if (priority >= 8) return "🔥 Critical";
  if (priority >= 6) return "⚡ High";
  if (priority >= 4) return "📈 Medium";
  return "📉 Low";
}
```

### Select Properties

Select properties allow choosing one option from a predefined list.

#### Simple API

```typescript
console.log(record.Status); // "Published"
console.log(record.Priority); // "High"
```

#### Advanced API

```typescript
console.log(record.advanced.Status);
// {
//   id: "uuid-here",
//   name: "Published",
//   color: "green"
// }
```

#### Working with Select Properties

```typescript
// Get select option color for styling
function getStatusColor(status: any): string {
  const colorMap = {
    draft: "#gray",
    "in-review": "#yellow",
    published: "#green",
    archived: "#red",
  };
  return colorMap[status.color] || "#gray";
}

// Create status badge HTML
function createStatusBadge(statusOption: any): string {
  const color = getStatusColor(statusOption);
  return `<span class="badge" style="background-color: ${color}">
    ${statusOption.name}
  </span>`;
}

// Filter by status using Query Builder
const publishedPosts = await notionCms
  .query("database-id")
  .where("Status")
  .equals("Published")
  .execute();
```

### Multi-Select Properties

Multi-select properties allow choosing multiple options from a predefined list.

#### Simple API

```typescript
console.log(record.Tags); // ["react", "typescript", "tutorial"]
```

#### Advanced API

```typescript
console.log(record.advanced.Tags);
// [
//   { id: "uuid1", name: "react", color: "blue" },
//   { id: "uuid2", name: "typescript", color: "purple" },
//   { id: "uuid3", name: "tutorial", color: "green" }
// ]
```

#### Working with Multi-Select Properties

```typescript
// Create tag cloud HTML
function createTagCloud(tags: any[]): string {
  return tags
    .map((tag) => {
      const color = getTagColor(tag.color);
      return `<span class="tag" style="background-color: ${color}">
      ${tag.name}
    </span>`;
    })
    .join(" ");
}

// Filter posts by tags
function filterByTags(posts: any[], requiredTags: string[]): any[] {
  return posts.filter((post) =>
    requiredTags.every((tag) => post.Tags.includes(tag))
  );
}

// Get most popular tags
function getPopularTags(posts: any[]): Array<{ tag: string; count: number }> {
  const tagCounts = new Map();

  posts.forEach((post) => {
    post.Tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
```

### Date Properties

Date properties store date and time information.

#### Simple API

```typescript
console.log(record.PublishDate); // Date object: 2024-01-15T00:00:00.000Z
console.log(record.PublishDate.toISOString()); // "2024-01-15T00:00:00.000Z"
```

#### Advanced API

```typescript
console.log(record.advanced.PublishDate);
// {
//   start: "2024-01-15",
//   end: null,
//   time_zone: null
// }
```

#### Working with Date Properties

```typescript
// Format dates for display
function formatDate(date: Date | null, locale: string = "en-US"): string {
  if (!date) return "No date set";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// Check if date is in the future
function isFutureDate(date: Date | null): boolean {
  if (!date) return false;
  return date > new Date();
}

// Get posts from last week
function getRecentPosts(posts: any[], days: number = 7): any[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return posts.filter(
    (post) => post.PublishDate && post.PublishDate >= cutoffDate
  );
}

// Sort by date
function sortByDate(posts: any[], ascending: boolean = false): any[] {
  return [...posts].sort((a, b) => {
    const dateA = a.PublishDate || new Date(0);
    const dateB = b.PublishDate || new Date(0);
    return ascending
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
}
```

### People Properties

People properties reference Notion users.

#### Simple API

```typescript
console.log(record.Assignees); // ["John Doe", "Jane Smith"]
console.log(record.Author); // ["Mike Johnson"]
```

#### Advanced API

```typescript
console.log(record.advanced.Author);
// [
//   {
//     object: "user",
//     id: "uuid-here",
//     name: "Mike Johnson",
//     avatar_url: "https://...",
//     type: "person",
//     person: { email: "mike@example.com" }
//   }
// ]
```

#### Working with People Properties

```typescript
// Create user avatar HTML
function createUserAvatar(user: any): string {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return `<div class="avatar" title="${user.name}">
    ${
      user.avatar_url
        ? `<img src="${user.avatar_url}" alt="${user.name}" />`
        : `<span>${initials}</span>`
    }
  </div>`;
}

// Get user email safely
function getUserEmail(user: any): string | null {
  return user.person?.email || user.bot?.email || null;
}

// Filter by assignee
const myTasks = await notionCms
  .query("tasks-db-id")
  .where("Assignee")
  .contains("user-id-here")
  .execute();
```

### Checkbox Properties

Checkbox properties store boolean values.

#### Simple API

```typescript
console.log(record.IsPublished); // true
console.log(record.IsCompleted); // false
```

#### Advanced API

```typescript
console.log(record.advanced.IsPublished); // true (same as simple)
```

#### Working with Checkbox Properties

```typescript
// Filter completed tasks
const completedTasks = posts.filter((task) => task.IsCompleted);

// Create status indicator
function createStatusIndicator(isComplete: boolean): string {
  return isComplete ? "✅ Complete" : "⏳ Pending";
}

// Toggle completion (would require API write operations)
async function toggleCompletion(pageId: string, currentStatus: boolean) {
  // This would require Notion API write capabilities
  // Currently Notion CMS is read-only
  console.log(
    `Would toggle ${pageId} from ${currentStatus} to ${!currentStatus}`
  );
}
```

### Files Properties

Files properties contain uploaded files and media.

#### Simple API

```typescript
console.log(record.Attachments);
// [
//   { name: "document.pdf", url: "https://files.notion.so/..." },
//   { name: "image.jpg", url: "https://files.notion.so/..." }
// ]
```

#### Advanced API

```typescript
console.log(record.advanced.Attachments);
// [
//   {
//     name: "document.pdf",
//     type: "file",
//     file: {
//       url: "https://files.notion.so/...",
//       expiry_time: "2024-01-15T..."
//     }
//   }
// ]
```

#### Working with File Properties

```typescript
// Download files
async function downloadFile(fileUrl: string, fileName: string): Promise<void> {
  const response = await fetch(fileUrl);
  const blob = await response.blob();

  // In browser environment
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// Check file types
function getFileType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
  const documentTypes = ["pdf", "doc", "docx", "txt"];

  if (imageTypes.includes(extension)) return "image";
  if (documentTypes.includes(extension)) return "document";
  return "other";
}

// Create file list HTML
function createFileList(files: any[]): string {
  return files
    .map((file) => {
      const type = getFileType(file.name);
      const icon = type === "image" ? "🖼️" : type === "document" ? "📄" : "📎";

      return `<a href="${file.url}" target="_blank" class="file-link">
      ${icon} ${file.name}
    </a>`;
    })
    .join("<br>");
}
```

### URL Properties

URL properties store web addresses.

#### Simple API

```typescript
console.log(record.Website); // "https://example.com"
console.log(record.Repository); // "https://github.com/user/repo"
```

#### Working with URL Properties

```typescript
// Validate URLs
function isValidUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Extract domain from URL
function getDomain(url: string | null): string | null {
  if (!isValidUrl(url)) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// Create clickable links
function createLink(url: string | null, text?: string): string {
  if (!isValidUrl(url)) return text || "Invalid URL";
  const domain = getDomain(url);
  const linkText = text || domain || url;

  return `<a href="${url}" target="_blank" rel="noopener noreferrer">
    ${linkText} ↗️
  </a>`;
}
```

## Advanced Property Patterns

### Property Validation

```typescript
// Validate record properties
interface ValidationRule {
  field: string;
  required: boolean;
  validator?: (value: any) => boolean;
  message?: string;
}

function validateRecord(record: any, rules: ValidationRule[]): string[] {
  const errors: string[] = [];

  rules.forEach((rule) => {
    const value = record[rule.field];

    if (
      rule.required &&
      (value === null || value === undefined || value === "")
    ) {
      errors.push(`${rule.field} is required`);
      return;
    }

    if (value && rule.validator && !rule.validator(value)) {
      errors.push(rule.message || `${rule.field} is invalid`);
    }
  });

  return errors;
}

// Usage
const blogPostRules: ValidationRule[] = [
  { field: "Title", required: true },
  { field: "Status", required: true },
  {
    field: "PublishDate",
    required: false,
    validator: (date) => date instanceof Date && !isNaN(date.getTime()),
    message: "Publish date must be a valid date",
  },
];

const errors = validateRecord(post, blogPostRules);
if (errors.length > 0) {
  console.warn("Validation errors:", errors);
}
```

### Property Transformation

```typescript
// Transform properties for different outputs
class PropertyTransformer {
  static forAPI(record: any): any {
    return {
      id: record.id,
      title: record.Title,
      slug: this.createSlug(record.Title),
      status: record.Status?.toLowerCase(),
      tags: record.Tags || [],
      publishDate: record.PublishDate?.toISOString(),
      excerpt: this.createExcerpt(record.Content, 150),
    };
  }

  static forRSS(record: any): any {
    return {
      title: record.Title,
      link: `https://myblog.com/posts/${this.createSlug(record.Title)}`,
      description: this.createExcerpt(record.Content, 300),
      pubDate: record.PublishDate,
      category: record.Tags,
    };
  }

  static createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }

  static createExcerpt(content: string, length: number): string {
    if (!content || content.length <= length) return content;
    return content.substring(0, length).trim() + "...";
  }
}
```

### Bulk Property Operations

```typescript
// Bulk property updates (conceptual - Notion CMS is read-only)
class BulkPropertyManager {
  static analyzeProperties(records: any[]): PropertyAnalysis {
    const analysis: PropertyAnalysis = {
      totalRecords: records.length,
      properties: new Map(),
      missingValues: new Map(),
      uniqueValues: new Map(),
    };

    records.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (key === "advanced" || key === "raw") return;

        const value = record[key];
        const propStats = analysis.properties.get(key) || {
          total: 0,
          nullCount: 0,
          type: typeof value,
        };

        propStats.total++;
        if (value === null || value === undefined) {
          propStats.nullCount++;
        }

        analysis.properties.set(key, propStats);

        // Track unique values for select/multi-select
        if (Array.isArray(value)) {
          value.forEach((v) => {
            const uniqueSet = analysis.uniqueValues.get(key) || new Set();
            uniqueSet.add(v);
            analysis.uniqueValues.set(key, uniqueSet);
          });
        } else if (value !== null) {
          const uniqueSet = analysis.uniqueValues.get(key) || new Set();
          uniqueSet.add(value);
          analysis.uniqueValues.set(key, uniqueSet);
        }
      });
    });

    return analysis;
  }

  static generateReport(analysis: PropertyAnalysis): string {
    let report = `Property Analysis Report\n`;
    report += `========================\n`;
    report += `Total Records: ${analysis.totalRecords}\n\n`;

    analysis.properties.forEach((stats, property) => {
      const completeness = (
        ((stats.total - stats.nullCount) / stats.total) *
        100
      ).toFixed(1);
      report += `${property}:\n`;
      report += `  Type: ${stats.type}\n`;
      report += `  Completeness: ${completeness}%\n`;

      const uniqueValues = analysis.uniqueValues.get(property);
      if (uniqueValues && uniqueValues.size < 20) {
        report += `  Unique Values: ${Array.from(uniqueValues).join(", ")}\n`;
      }
      report += "\n";
    });

    return report;
  }
}

interface PropertyAnalysis {
  totalRecords: number;
  properties: Map<string, PropertyStats>;
  missingValues: Map<string, number>;
  uniqueValues: Map<string, Set<any>>;
}

interface PropertyStats {
  total: number;
  nullCount: number;
  type: string;
}
```

## Best Practices

### 1. Always Handle Null Values

```typescript
// ❌ Don't assume properties have values
const title = record.Title.toUpperCase(); // Error if Title is null

// ✅ Always check for null/undefined
const title = record.Title?.toUpperCase() || "Untitled";
```

### 2. Use Type Guards

```typescript
// Type guard for dates
function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

// Usage
if (isValidDate(record.PublishDate)) {
  console.log(record.PublishDate.toISOString());
}
```

### 3. Leverage the Right API Level

```typescript
// ✅ Use Simple API for business logic
const isPublished = record.Status === "Published";

// ✅ Use Advanced API for presentation
const statusColor = record.advanced.Status?.color;

// ✅ Use Raw API for debugging
console.log("Raw data:", record.raw.properties);
```

### 4. Cache Expensive Operations

```typescript
// Cache property transformations
const transformCache = new Map();

function getCachedTransform(record: any, transformer: string): any {
  const key = `${record.id}-${transformer}`;
  if (transformCache.has(key)) {
    return transformCache.get(key);
  }

  const result = PropertyTransformer[transformer](record);
  transformCache.set(key, result);
  return result;
}
```

## Related Documentation

- **[Database Operations](../api-reference/database-operations.md)** - Working with database records
- **[Query Builder](../api-reference/query-builder.md)** - Filtering and sorting by properties
- **[Type Generation](../api-reference/type-generation.md)** - Generate types for your properties
