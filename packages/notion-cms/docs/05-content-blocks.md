# Content Blocks

Notion CMS can convert Notion page content blocks into Markdown or HTML, making it easy to render Notion pages in your application.

## Overview

Content blocks represent the rich content inside Notion pages - paragraphs, headings, images, lists, tables, and more. Notion CMS provides converters to transform these blocks into formats suitable for rendering.

## Getting Page Content

First, retrieve the blocks from a Notion page:

```typescript
const pageId = "your-notion-page-id"
const blocks = await notionCMS.getPageContent(pageId)

// Blocks are returned as ContentBlockRaw[]
// These are the complete Notion API block structures
```

### Recursive Content

By default, `getPageContent` fetches nested content recursively. This means it will:

1. Fetch all top-level blocks
2. For each block that has children (like toggles, columns, nested lists), fetch those children
3. Continue recursively until all nested content is retrieved

```typescript
// Fetches all blocks including nested children (default)
// Makes multiple API calls to get complete content hierarchy
const blocks = await notionCMS.getPageContent(pageId, { recursive: true })

// Fetch only top-level blocks
// Single API call, faster but incomplete if page has nested content
const topLevelBlocks = await notionCMS.getPageContent(pageId, {
  recursive: false
})
```

**Performance considerations:**

- **Recursive (default)**: Complete content but requires multiple API calls for pages with nested structures
- **Non-recursive**: Faster (single API call) but may miss nested content like:
  - Toggle blocks with hidden content
  - Column layouts with nested blocks
  - Nested list items
  - Synced blocks

For most use cases, keep `recursive: true` (default) to ensure complete content.

## Converting to Markdown

Convert blocks to Markdown for rendering in markdown processors or static site generators:

```typescript
import { blocksToMarkdown } from "@mikemajara/notion-cms"

const blocks = await notionCMS.getPageContent(pageId)
const markdown = blocksToMarkdown(blocks)

console.log(markdown)
// Full markdown string ready for rendering
```

### Markdown Options

Customize markdown output:

```typescript
const markdown = blocksToMarkdown(blocks, {
  listIndent: "  ", // Indentation for nested lists (default: "  ")
  debug: false, // Include debug placeholders for unsupported blocks (default: false)
  alternateOrderedListStyles: false // Use a/b/c and i/ii/iii styles (default: false)
})
```

### Example Output

```markdown
# Heading 1

This is a paragraph with **bold** and _italic_ text.

## Heading 2

- Bullet point 1
- Bullet point 2
  - Nested bullet

1. Numbered item 1
2. Numbered item 2

> This is a quote block

\`\`\`
typescript
const code = "example"
\`\`\`

![Image caption](https://example.com/image.jpg)
```

## Converting to HTML

Convert blocks to HTML for direct rendering:

```typescript
import { blocksToHtml } from "@mikemajara/notion-cms"

const blocks = await notionCMS.getPageContent(pageId)
const html = blocksToHtml(blocks)

console.log(html)
// Full HTML string ready for rendering
```

### HTML Options

Customize HTML output:

```typescript
const html = blocksToHtml(blocks, {
  classPrefix: "notion-" // CSS class prefix (default: "")
})
```

### Example Output

```html
<h1>Heading 1</h1>
<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<h2>Heading 2</h2>
<ul>
  <li>Bullet point 1</li>
  <li>
    Bullet point 2
    <ul>
      <li>Nested bullet</li>
    </ul>
  </li>
</ul>
<blockquote>This is a quote block</blockquote>
<pre><code class="language-typescript">const code = "example"</code></pre>
<img src="https://example.com/image.jpg" alt="Image caption" />
```

## Supported Block Types

### Text Blocks

- ✅ **Paragraph** - Regular text paragraphs
- ✅ **Heading 1/2/3** - Three levels of headings
- ✅ **Quote** - Blockquotes
- ✅ **Code** - Code blocks with language support
- ✅ **Callout** - Callout blocks with icons

### List Blocks

- ✅ **Bulleted List** - Unordered lists
- ✅ **Numbered List** - Ordered lists
- ✅ **To-do** - Checkbox lists
- ✅ **Toggle** - Collapsible sections

### Media Blocks

- ✅ **Image** - Images (external and Notion-hosted)
- ✅ **Video** - Video embeds
- ✅ **Audio** - Audio files
- ✅ **File** - File attachments
- ✅ **PDF** - PDF documents

### Link Blocks

- ✅ **Bookmark** - Link previews
- ✅ **Embed** - Embedded content
- ✅ **Link Preview** - Link previews

### Structural Blocks

- ✅ **Divider** - Horizontal dividers
- ✅ **Table** - Tables with rows and cells
- ✅ **Columns** - Multi-column layouts
- ✅ **Synced Block** - Synced content blocks
- ✅ **Template** - Template blocks

### Special Blocks

- ✅ **Equation** - Mathematical equations (LaTeX)

### Unsupported Blocks (Debug Mode)

These blocks are skipped by default but can be shown in debug mode:

- ⚠️ **Child Page** - Links to child pages (only in debug mode)
- ⚠️ **Child Database** - Links to child databases (only in debug mode)
- ⚠️ **Breadcrumb** - Navigation breadcrumbs (only in debug mode)
- ⚠️ **Table of Contents** - TOC blocks (only in debug mode)

## Using with File Management

When file caching is enabled, images and files are automatically processed:

```typescript
const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "local", // or "remote"
    storage: {
      path: "./public/assets/notion-files"
    }
  }
})

// Images and files in blocks are automatically cached
const blocks = await notionCMS.getPageContent(pageId)
const markdown = blocksToMarkdown(blocks)
// Image URLs are now local/cached URLs instead of Notion URLs
```

## Advanced: Block Conversion Layers

### Simple Blocks

Convert blocks to a simplified structure:

```typescript
import { convertBlocksToSimple } from "@mikemajara/notion-cms"

const blocks = await notionCMS.getPageContent(pageId)
const simpleBlocks = await convertBlocksToSimple(blocks, {
  fileManager: notionCMS.fileManager // Optional: for file processing
})

// Simple blocks have a consistent structure:
// { id, type, content, children?, hasChildren }
```

### Advanced Blocks

Convert blocks with full metadata:

```typescript
import { convertBlocksToAdvanced } from "@mikemajara/notion-cms"

const blocks = await notionCMS.getPageContent(pageId)
const advancedBlocks = await convertBlocksToAdvanced(blocks, {
  mediaUrlResolver: async (block, field) => {
    // Custom media URL resolution
    return customUrl
  }
})

// Advanced blocks preserve all Notion metadata
```

## Rich Text Formatting

Rich text formatting (bold, italic, links, etc.) is preserved in both Markdown and HTML:

```typescript
// Notion rich text:
// "This is **bold** and *italic* with a [link](https://example.com)"

// Markdown output:
// "This is **bold** and *italic* with a [link](https://example.com)"

// HTML output:
// "This is <strong>bold</strong> and <em>italic</em> with a <a href="https://example.com">link</a>"
```

## Tables

Tables are fully supported:

```typescript
// Markdown output:
// | Column 1 | Column 2 |
// | --- | --- |
// | Cell 1 | Cell 2 |

// HTML output:
// <table>
//   <thead>
//     <tr><th>Column 1</th><th>Column 2</th></tr>
//   </thead>
//   <tbody>
//     <tr><td>Cell 1</td><td>Cell 2</td></tr>
//   </tbody>
// </table>
```

## Code Blocks

Code blocks preserve language information:

````typescript
// Markdown:
// ```typescript
// const code = "example"
// ```

// HTML:
// <pre><code class="language-typescript">const code = "example"</code></pre>
````

## Image Handling

Images are handled differently based on your file strategy:

### Direct Strategy (Default)

```typescript
// Images use original Notion URLs
// Note: These URLs expire after ~1 hour
const markdown = blocksToMarkdown(blocks)
// ![caption](https://s3.us-west-2.amazonaws.com/...)
```

### Local/Remote Strategy

```typescript
// Images are cached and use stable URLs
const markdown = blocksToMarkdown(blocks)
// ![caption](/assets/notion-files/abc123.jpg)
```

## Common Patterns

### Pattern: Blog Post Rendering

```typescript
// Fetch page record
const post = await notionCMS
  .query("blogPosts", { recordType: "simple" })
  .filter("slug", "equals", "my-post")
  .single()

// Fetch and convert content
const blocks = await notionCMS.getPageContent(post.id)
const markdown = blocksToMarkdown(blocks)

// Render with your markdown processor
const html = renderMarkdown(markdown)
```

### Pattern: Documentation Site

```typescript
// Generate static pages
const docs = await notionCMS
  .query("documentation", { recordType: "simple" })
  .all()

for (const doc of docs) {
  const blocks = await notionCMS.getPageContent(doc.id)
  const html = blocksToHtml(blocks, { classPrefix: "doc-" })

  // Save to file or render in your framework
  await saveDocPage(doc.slug, html)
}
```

### Pattern: Preview Generation

```typescript
// Get first few blocks for preview
const blocks = await notionCMS.getPageContent(pageId, { recursive: false })
const previewBlocks = blocks.slice(0, 3) // First 3 blocks
const previewMarkdown = blocksToMarkdown(previewBlocks)
```

## Limitations

### Known Issues

- **Nested Lists**: Numbered lists with nested bullet lists may have incorrect indentation in some cases
- **Bookmark Rendering**: Bookmarks render as simple links, not rich previews
- **Child Pages**: Child page blocks are skipped unless debug mode is enabled
- **Formula Blocks**: Currently not supported in content conversion

### Unsupported Block Types

Some Notion block types are not yet supported. These are silently skipped unless debug mode is enabled. See the [Limitations](./08-limitations.md) guide for a complete supportability matrix.

## Next Steps

- Learn about **[File Management](./06-file-management.md)** - Caching Notion files
- Review **[Limitations](./08-limitations.md)** - Complete block supportability matrix
- See **[Real-World Examples](./07-examples.md)** - Content rendering patterns
