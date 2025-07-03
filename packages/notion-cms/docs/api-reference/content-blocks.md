# Content Blocks

Notion CMS provides powerful methods for fetching and transforming Notion page content blocks into usable formats like Markdown and HTML.

## Overview

The content blocks system allows you to:

- **Fetch Page Content** - Retrieve all blocks from a Notion page
- **Transform to Markdown** - Convert blocks to Markdown with high fidelity
- **Transform to HTML** - Convert blocks to HTML for web rendering
- **Handle Hierarchical Content** - Support nested blocks and complex structures
- **Process Rich Text** - Preserve formatting, links, and styling

## Core Methods

### getPageContent()

Fetch all content blocks from a Notion page.

#### Syntax

```typescript
getPageContent(pageId: string, recursive?: boolean): Promise<SimpleBlock[]>
```

#### Parameters

| Parameter   | Type      | Default | Description                          |
| ----------- | --------- | ------- | ------------------------------------ |
| `pageId`    | `string`  | -       | The ID of the Notion page            |
| `recursive` | `boolean` | `true`  | Whether to fetch nested child blocks |

#### Return Value

```typescript
interface SimpleBlock {
  id: string;
  type: string;
  content: any;
  children?: SimpleBlock[];
  hasChildren: boolean;
}
```

#### Examples

##### Basic Usage

```typescript
const notionCms = new NotionCMS("your-api-key");

// Fetch all blocks from a page
const blocks = await notionCms.getPageContent("page-id");

console.log(`Found ${blocks.length} blocks`);

blocks.forEach((block) => {
  console.log(`Block type: ${block.type}`);
  console.log(`Has children: ${block.hasChildren}`);
});
```

##### Without Nested Blocks

```typescript
// Fetch only top-level blocks (no children)
const topLevelBlocks = await notionCms.getPageContent("page-id", false);
```

### blocksToMarkdown()

Convert Notion blocks to Markdown format.

#### Syntax

```typescript
blocksToMarkdown(blocks: SimpleBlock[]): string
```

#### Parameters

| Parameter | Type            | Default | Description                |
| --------- | --------------- | ------- | -------------------------- |
| `blocks`  | `SimpleBlock[]` | -       | Array of blocks to convert |
| `options` | `object`        | `{}`    | Conversion options         |

#### Return Value

```typescript
string; // Markdown representation of the blocks
```

#### Examples

##### Basic Conversion

```typescript
const blocks = await notionCms.getPageContent("page-id");
const markdown = notionCms.blocksToMarkdown(blocks);

console.log(markdown);
// # My Page Title
//
// This is a paragraph with **bold** text.
//
// - List item 1
// - List item 2
```

##### With Image URLs

```typescript
const markdown = notionCms.blocksToMarkdown(blocks);

console.log(markdown);
// # My Page Title
//
// ![Image description](https://files.notion.so/image-url)
//
// This is content with images included.
```

### blocksToHtml()

Convert Notion blocks to HTML format.

#### Syntax

```typescript
blocksToHtml(blocks: SimpleBlock[]): string
```

#### Parameters

| Parameter | Type            | Description                |
| --------- | --------------- | -------------------------- |
| `blocks`  | `SimpleBlock[]` | Array of blocks to convert |

#### Return Value

```typescript
string; // HTML representation of the blocks
```

#### Examples

##### Basic Conversion

```typescript
const blocks = await notionCms.getPageContent("page-id");
const html = notionCms.blocksToHtml(blocks);

console.log(html);
// <h1>My Page Title</h1>
// <p>This is a paragraph with <strong>bold</strong> text.</p>
// <ul>
//   <li>List item 1</li>
//   <li>List item 2</li>
// </ul>
```

## Supported Block Types

### Text Blocks

#### Paragraph

```markdown
This is a regular paragraph with **bold**, _italic_, and ~~strikethrough~~ text.
```

```html
<p>
  This is a regular paragraph with <strong>bold</strong>, <em>italic</em>, and
  <del>strikethrough</del> text.
</p>
```

#### Headings

```markdown
# Heading 1

## Heading 2

### Heading 3
```

```html
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
```

### List Blocks

#### Bulleted Lists

```markdown
- First item
- Second item
  - Nested item
  - Another nested item
- Third item
```

```html
<ul>
  <li>First item</li>
  <li>
    Second item
    <ul>
      <li>Nested item</li>
      <li>Another nested item</li>
    </ul>
  </li>
  <li>Third item</li>
</ul>
```

#### Numbered Lists

```markdown
1. First item
2. Second item
   1. Nested item
   2. Another nested item
3. Third item
```

```html
<ol>
  <li>First item</li>
  <li>
    Second item
    <ol>
      <li>Nested item</li>
      <li>Another nested item</li>
    </ol>
  </li>
  <li>Third item</li>
</ol>
```

### Code Blocks

#### Inline Code

```markdown
Use the `useState` hook for state management.
```

```html
<p>Use the <code>useState</code> hook for state management.</p>
```

#### Code Blocks

```markdown
\`\`\`javascript
function greet(name) {
return \`Hello, \${name}!\`;
}
\`\`\`
```

```html
<pre><code class="language-javascript">function greet(name) {
  return \`Hello, \${name}!\`;
}</code></pre>
```

### Quote Blocks

```markdown
> This is a quote block with **formatted** text.
```

```html
<blockquote>
  <p>This is a quote block with <strong>formatted</strong> text.</p>
</blockquote>
```

### Divider

```markdown
---
```

```html
<hr />
```

### Toggle Blocks

```markdown
<details>
<summary>Toggle Title</summary>

Content inside the toggle block.

</details>
```

```html
<details>
  <summary>Toggle Title</summary>
  <p>Content inside the toggle block.</p>
</details>
```

### Callout Blocks

```markdown
> 💡 **Note**: This is a callout block with an icon and styled content.
```

```html
<div class="callout">
  <div class="callout-icon">💡</div>
  <div class="callout-content">
    <p>
      <strong>Note</strong>: This is a callout block with an icon and styled
      content.
    </p>
  </div>
</div>
```

## Rich Text Formatting

### Text Annotations

Notion CMS preserves all text formatting:

| Notion Format     | Markdown            | HTML                       |
| ----------------- | ------------------- | -------------------------- |
| **Bold**          | `**Bold**`          | `<strong>Bold</strong>`    |
| _Italic_          | `*Italic*`          | `<em>Italic</em>`          |
| ~~Strikethrough~~ | `~~Strikethrough~~` | `<del>Strikethrough</del>` |
| `Code`            | `` `Code` ``        | `<code>Code</code>`        |
| Underline         | `<u>Underline</u>`  | `<u>Underline</u>`         |

### Links

```markdown
[Link text](https://example.com)
```

```html
<a href="https://example.com">Link text</a>
```

### Colors

Notion text colors are preserved in HTML but simplified in Markdown:

```html
<!-- HTML preserves colors -->
<span style="color: red;">Red text</span>
<span style="background-color: yellow;">Highlighted text</span>
```

```markdown
<!-- Markdown uses standard formatting -->

Red text (color information lost)
Highlighted text (color information lost)
```

## Complete Example

### Fetching and Converting Page Content

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!);

async function convertPageToMarkdown(pageId: string): Promise<string> {
  try {
    // Fetch all blocks from the page
    const blocks = await notionCms.getPageContent(pageId);

    // Convert to markdown
    const markdown = notionCms.blocksToMarkdown(blocks);

    return markdown;
  } catch (error) {
    console.error("Error converting page:", error);
    throw error;
  }
}

async function convertPageToHtml(pageId: string): Promise<string> {
  try {
    // Fetch all blocks from the page
    const blocks = await notionCms.getPageContent(pageId);

    // Convert to HTML
    const html = notionCms.blocksToHtml(blocks);

    return html;
  } catch (error) {
    console.error("Error converting page:", error);
    throw error;
  }
}

// Usage
const pageId = "your-page-id";

// Get markdown version
const markdown = await convertPageToMarkdown(pageId);
console.log("Markdown:", markdown);

// Get HTML version
const html = await convertPageToHtml(pageId);
console.log("HTML:", html);
```

### Blog Post Conversion

```typescript
import { RecordBlog } from "./generated-types";

async function convertBlogPostsToMarkdown() {
  // Get all blog posts
  const { results: posts } = await notionCms.getDatabase<RecordBlog>("blog-db-id");

  // Convert each post's content
  const postsWithContent = await Promise.all(
    posts.map(async (post) => {
      // Get the page content
      const blocks = await notionCms.getPageContent(post.id);

      // Convert to markdown
      const content = notionCms.blocksToMarkdown(blocks);

      return {
        ...post,
        content,
        slug: post.Title.toLowerCase().replace(/\s+/g, "-")
      };
    })
  );

  return postsWithContent;
}

// Generate static blog files
const blogPosts = await convertBlogPostsToMarkdown();

blogPosts.forEach((post) => {
  const frontmatter = \`---
title: "\${post.Title}"
date: \${post["Publish Date"].toISOString()}
tags: [\${post.Tags.map((tag) => \`"\${tag}"\`).join(", ")}]
status: \${post.Status}
---

\`;

  const fullMarkdown = frontmatter + post.content;

  // Save to file system
  fs.writeFileSync(\`./blog/\${post.slug}.md\`, fullMarkdown);
});
```

## Performance Considerations

### Caching Page Content

```typescript
class CachedNotionCMS {
  private cache = new Map<string, SimpleBlock[]>();
  private cms: NotionCMS;

  constructor(apiKey: string) {
    this.cms = new NotionCMS(apiKey);
  }

  async getPageContent(pageId: string, recursive: boolean = true): Promise<SimpleBlock[]> {
    const cacheKey = \`\${pageId}-\${recursive}\`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const blocks = await this.cms.getPageContent(pageId, recursive);
    this.cache.set(cacheKey, blocks);

    return blocks;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### Batch Processing

```typescript
async function processMultiplePages(pageIds: string[]): Promise<void> {
  // Process in batches to avoid rate limits
  const batchSize = 5;

  for (let i = 0; i < pageIds.length; i += batchSize) {
    const batch = pageIds.slice(i, i + batchSize);

    await Promise.all(batch.map(async (pageId) => {
      try {
        const blocks = await notionCms.getPageContent(pageId);
        const markdown = notionCms.blocksToMarkdown(blocks);

        // Process the markdown
        await processMarkdown(pageId, markdown);
      } catch (error) {
        console.error(\`Error processing page \${pageId}:\`, error);
      }
    }));

    // Add delay between batches
    if (i + batchSize < pageIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
```

## Related Documentation

- **[Database Operations](./database-operations.md)** - Working with database records that contain page content
- **[Core Concepts](../core-concepts.md)** - Understanding the layered API architecture
- **[Examples](../examples/)** - Real-world examples of content processing
