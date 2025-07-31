---
title: "Advanced API"
description: "Access rich metadata and formatting information with the advanced API layer."
date: "2024-01-19"
---

# Advanced API

The Advanced API preserves rich metadata from Notion properties while providing a cleaner interface than the raw Notion API. Use this when you need formatting details, colors, or rich content features.

## Why Use the Advanced API?

- **Rich formatting**: Access bold, italic, and color formatting
- **Property metadata**: Get select option colors, user details, file info
- **Design systems**: Use Notion's color schemes in your UI
- **Rich content**: Preserve text formatting for editors

## Accessing Advanced Properties

```typescript
import { NotionCMS } from "@mikemajara/notion-cms"

const cms = new NotionCMS("your-notion-api-key")
const { results } = await cms.getDatabase("database-id")

const record = results[0]

// Simple access still works
console.log(record.Title) // "My Blog Post"

// Advanced access provides metadata
console.log(record.advanced.Title)
// [{ content: "My Blog Post", annotations: {...}, href: null }]
```

## Rich Text with Formatting

Access detailed formatting information:

```typescript
const record = results[0]

// Simple: Plain text or Markdown
console.log(record.Description)
// "This is **bold** and *italic* text"

// Advanced: Array of rich text objects
record.advanced.Description.forEach((textObj) => {
  console.log(textObj.content) // "This is "
  console.log(textObj.annotations.bold) // false
  console.log(textObj.annotations.italic) // false
  console.log(textObj.annotations.color) // "default"

  if (textObj.href) {
    console.log("Link:", textObj.href)
  }
})
```

## Select Properties with Colors

Multi-select and select properties include color information:

```typescript
const record = results[0]

// Simple: Array of strings
console.log(record.Tags) // ["urgent", "bug-fix"]

// Advanced: Array with metadata
record.advanced.Tags.forEach((tag) => {
  console.log(tag.name) // "urgent"
  console.log(tag.color) // "red"
  console.log(tag.id) // "abc123"
})

// Use in your UI
const tagElements = record.advanced.Tags.map((tag) => ({
  name: tag.name,
  color: `notion-${tag.color}`, // Use in CSS classes
  id: tag.id,
}))
```

## People Properties with Details

Access user information including avatars and emails:

```typescript
const record = results[0]

// Simple: Array of names
console.log(record.Assignees) // ["John Doe", "Jane Smith"]

// Advanced: Full user objects
record.advanced.Assignees.forEach((user) => {
  console.log(user.name) // "John Doe"
  console.log(user.avatar_url) // Profile image URL
  console.log(user.type) // "person"

  if (user.person?.email) {
    console.log(user.person.email) // "john@example.com"
  }
})
```

## File Properties with Metadata

Get detailed file information:

```typescript
const record = results[0]

// Simple: Array of filenames
console.log(record.Attachments) // ["document.pdf", "image.jpg"]

// Advanced: File objects with URLs and metadata
record.advanced.Attachments.forEach((file) => {
  console.log(file.name) // "document.pdf"
  console.log(file.url) // Download URL
  console.log(file.type) // "file" or "external"

  if (file.file) {
    console.log(file.file.expiry_time) // URL expiration
  }
})
```

## Date Properties

Dates include time zone and formatting information:

```typescript
const record = results[0]

// Simple: JavaScript Date
console.log(record.PublishDate) // Date object

// Advanced: Notion date object
if (record.advanced.PublishDate) {
  console.log(record.advanced.PublishDate.start) // "2024-01-15"
  console.log(record.advanced.PublishDate.end) // null (if no end date)
  console.log(record.advanced.PublishDate.time_zone) // "America/New_York"
}
```

## Common Use Cases

### Rich Text Editor

```typescript
function convertToEditorFormat(richTextArray) {
  return richTextArray.map((textObj) => ({
    text: textObj.content,
    bold: textObj.annotations.bold,
    italic: textObj.annotations.italic,
    underline: textObj.annotations.underline,
    strikethrough: textObj.annotations.strikethrough,
    code: textObj.annotations.code,
    color: textObj.annotations.color,
    link: textObj.href,
  }))
}

const editorContent = convertToEditorFormat(record.advanced.Description)
```

### Tag Component with Colors

```typescript
function TagComponent({ tag }) {
  const colorMap = {
    red: "#ff6b6b",
    blue: "#4dabf7",
    green: "#51cf66",
    yellow: "#ffd43b",
    orange: "#ff8cc8",
    pink: "#f783ac",
    purple: "#9775fa",
    gray: "#868e96",
  }

  return (
    <span
      style={{
        backgroundColor: colorMap[tag.color] || "#868e96",
        padding: "4px 8px",
        borderRadius: "4px",
        color: "white",
      }}
    >
      {tag.name}
    </span>
  )
}

// Usage
record.advanced.Tags.map((tag) => <TagComponent key={tag.id} tag={tag} />)
```

### User Avatar Display

```typescript
function UserAvatar({ user }) {
  return (
    <div className="user-avatar">
      {user.avatar_url && (
        <img
          src={user.avatar_url}
          alt={user.name}
          width="32"
          height="32"
          style={{ borderRadius: "50%" }}
        />
      )}
      <span>{user.name}</span>
    </div>
  )
}

// Usage
record.advanced.Assignees.map((user) => (
  <UserAvatar key={user.id} user={user} />
))
```

### File Download Links

```typescript
function FileDownload({ files }) {
  return (
    <div>
      {files.map((file) => (
        <a
          key={file.name}
          href={file.url}
          download={file.name}
          target="_blank"
          rel="noopener noreferrer"
        >
          📎 {file.name}
        </a>
      ))}
    </div>
  )
}

// Usage
;<FileDownload files={record.advanced.Attachments} />
```

## Mixing Simple and Advanced

You can use both APIs in the same code:

```typescript
const record = results[0]

// Use simple for basic data
const title = record.Title
const publishDate = record.PublishDate

// Use advanced for rich features
const tagColors = record.advanced.Tags.map((tag) => ({
  name: tag.name,
  color: tag.color,
}))

const hasLinks = record.advanced.Description.some((text) => text.href)
```

## When to Use Advanced API

✅ **Perfect for:**

- Rich text editors and WYSIWYG interfaces
- Design systems using Notion's colors
- User management and avatar displays
- File management with download links
- Recreating Notion-like interfaces

❌ **Consider simplified API for:**

- Simple content display
- Basic data processing
- When you don't need formatting details
- Quick prototyping

## Performance Notes

- Advanced API requires slightly more processing than simplified
- File URLs from Notion expire after a few hours
- Use caching for frequently accessed file content
- Consider the [File Management](./file-management.md) options for better file handling

## Next Steps

- **[Content Parsing](./content-parsing.md)** - Convert rich content to HTML/Markdown
- **[File Management](./file-management.md)** - Handle file caching and storage
- **[Raw API](./raw-api.md)** - Access complete Notion responses for debugging
