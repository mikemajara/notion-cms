# Limitations & Known Issues

This document provides a comprehensive overview of what's supported, what's partially supported, and what's not yet supported in Notion CMS.

## Supportability Matrices

### Content Block Supportability Matrix

This matrix shows which Notion block types are supported in content conversion (Markdown/HTML).

| Block Type            | Markdown | HTML | Advanced | Notes                                            |
| --------------------- | -------- | ---- | -------- | ------------------------------------------------ |
| **Text Blocks**       |
| `paragraph`           | ✅       | ✅   | ✅       | Full support                                     |
| `heading_1`           | ✅       | ✅   | ✅       | Full support                                     |
| `heading_2`           | ✅       | ✅   | ✅       | Full support                                     |
| `heading_3`           | ✅       | ✅   | ✅       | Full support                                     |
| `quote`               | ✅       | ✅   | ✅       | Full support                                     |
| `code`                | ✅       | ✅   | ✅       | Language preserved                               |
| `callout`             | ⚠️       | ⚠️   | ✅       | Icon not rendered in Markdown/HTML               |
| **List Blocks**       |
| `bulleted_list_item`  | ✅       | ✅   | ✅       | Full support                                     |
| `numbered_list_item`  | ✅       | ✅   | ✅       | Full support                                     |
| `to_do`               | ✅       | ✅   | ✅       | Checkbox state preserved                         |
| `toggle`              | ✅       | ✅   | ✅       | Collapsible content rendered                     |
| **Media Blocks**      |
| `image`               | ✅       | ✅   | ✅       | Caption supported, file caching works            |
| `video`               | ✅       | ✅   | ✅       | File caching works                               |
| `audio`               | ✅       | ✅   | ✅       | File caching works                               |
| `file`                | ✅       | ✅   | ✅       | File caching works                               |
| `pdf`                 | ✅       | ✅   | ✅       | File caching works                               |
| **Link Blocks**       |
| `bookmark`            | ⚠️       | ⚠️   | ✅       | Renders as simple link, not rich preview         |
| `embed`               | ⚠️       | ⚠️   | ✅       | Renders as simple link                           |
| `link_preview`        | ⚠️       | ⚠️   | ✅       | Renders as simple link                           |
| **Structural Blocks** |
| `divider`             | ✅       | ✅   | ✅       | Full support                                     |
| `table`               | ✅       | ✅   | ✅       | Full support with headers                        |
| `table_row`           | ✅       | ✅   | ✅       | Full support                                     |
| `columns`             | ✅       | ✅   | ✅       | Columns flattened in Markdown                    |
| `column`              | ✅       | ✅   | ✅       | Full support                                     |
| `synced_block`        | ✅       | ✅   | ✅       | Synced content rendered                          |
| `template`            | ✅       | ✅   | ✅       | Template content rendered                        |
| **Special Blocks**    |
| `equation`            | ✅       | ✅   | ✅       | LaTeX syntax preserved                           |
| **Debug-Only Blocks** |
| `child_page`          | ⚠️       | ⚠️   | ✅       | Only shown in debug mode, renders as placeholder |
| `child_database`      | ⚠️       | ⚠️   | ✅       | Only shown in debug mode, renders as placeholder |
| `breadcrumb`          | ⚠️       | ⚠️   | ✅       | Only shown in debug mode, renders as placeholder |
| `table_of_contents`   | ⚠️       | ⚠️   | ✅       | Only shown in debug mode, renders as placeholder |

**Legend:**

- ✅ Fully supported
- ⚠️ Partially supported or has limitations
- ❌ Not supported

### Database Property Supportability Matrix

This matrix shows which Notion property types are supported in each API layer.

| Property Type            | Simple Layer | Advanced Layer | Query Builder | Notes                                                                           |
| ------------------------ | ------------ | -------------- | ------------- | ------------------------------------------------------------------------------- |
| **Basic Properties**     |
| `title`                  | ✅           | ✅             | ✅            | Converts to string                                                              |
| `rich_text`              | ✅           | ✅             | ✅            | Converts to string (first plain_text)                                           |
| `number`                 | ✅           | ✅             | ✅            | Full support                                                                    |
| `checkbox`               | ✅           | ✅             | ✅            | Converts to boolean                                                             |
| `date`                   | ✅           | ✅             | ✅            | Converts to Date object (Simple) or object with parsed dates (Advanced)         |
| `select`                 | ✅           | ✅             | ✅            | Converts to string (Simple) or object with id/name/color (Advanced)             |
| `multi_select`           | ✅           | ✅             | ✅            | Converts to string[] (Simple) or array of objects (Advanced)                    |
| `status`                 | ❌           | ✅             | ✅            | **Not supported in Simple layer** - use Advanced or Raw                         |
| `unique_id`              | ✅           | ✅             | ✅            | Converts to number (Simple) or object with prefix/number (Advanced)             |
| **People Properties**    |
| `people`                 | ✅           | ✅             | ✅            | Converts to string[] of names (Simple) or array of user objects (Advanced)      |
| `created_by`             | ✅           | ✅             | ✅            | Converts to user object (Simple) or detailed user object (Advanced)             |
| `last_edited_by`         | ✅           | ✅             | ✅            | Converts to user object (Simple) or detailed user object (Advanced)             |
| **File Properties**      |
| `files`                  | ✅           | ✅             | ✅            | File caching supported, converts to array of file objects                       |
| **Link Properties**      |
| `url`                    | ✅           | ✅             | ✅            | Full support                                                                    |
| `email`                  | ✅           | ✅             | ✅            | Full support                                                                    |
| `phone_number`           | ✅           | ✅             | ✅            | Full support                                                                    |
| **Relation Properties**  |
| `relation`               | ✅           | ✅             | ✅            | Converts to string[] of page IDs                                                |
| **Formula Properties**   |
| `formula`                | ⚠️           | ⚠️             | ✅            | **Partial support** - Returns raw formula value, type inference not implemented |
| **Rollup Properties**    |
| `rollup`                 | ⚠️           | ⚠️             | ✅            | **Partial support** - Returns raw rollup value, processing not implemented      |
| **Timestamp Properties** |
| `created_time`           | ✅           | ✅             | ✅            | Converts to ISO string (Simple) or object with timestamp/date (Advanced)        |
| `last_edited_time`       | ✅           | ✅             | ✅            | Converts to ISO string (Simple) or object with timestamp/date (Advanced)        |
| **Other Properties**     |
| `button`                 | ❌           | ❌             | ❌            | Not supported                                                                   |
| `verification`           | ❌           | ❌             | ❌            | Not supported                                                                   |
| `unknown`                | ❌           | ❌             | ⚠️            | May work in Query Builder but not converted                                     |

**Legend:**

- ✅ Fully supported
- ⚠️ Partially supported or has limitations
- ❌ Not supported

## Known Issues

### Status Property in Simple Layer

**Issue:** The `status` property type is not supported in the Simple layer conversion.

**Workaround:** Use the Advanced or Raw layer:

```typescript
// ❌ Doesn't work
const record = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .single()
console.log(record.Status) // May be undefined or incorrect

// ✅ Use Advanced layer
const record = await notionCMS
  .query("myDatabase", { recordType: "advanced" })
  .single()
console.log(record.Status) // { id: "...", name: "Published", color: "green" }
```

**Status:** Tracked in codebase TODO - needs implementation

### Formula Type Inference

**Issue:** Formula properties return raw values without type inference. The Simple layer doesn't parse the formula result type (string, number, boolean, date).

**Workaround:** Use Advanced layer or Raw layer to access formula type information:

```typescript
// Simple layer - may not match expected type
const record = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .single()
console.log(record.Formula) // Raw value, type unknown

// Advanced layer - includes type information
const record = await notionCMS
  .query("myDatabase", { recordType: "advanced" })
  .single()
console.log(record.Formula) // { type: "string" | "number" | "boolean" | "date", value: ... }
```

**Status:** Partial implementation - type information available in Advanced layer

### Rollup Processing

**Issue:** Rollup properties return raw Notion API values without processing or type conversion.

**Workaround:** Access rollup data through Raw layer and process manually:

```typescript
const record = await notionCMS
  .query("myDatabase", { recordType: "raw" })
  .single()

const rollup = record.properties.MyRollup.rollup
// Process based on rollup.type and rollup.function
```

**Status:** Partial implementation - raw values available but not processed

### Nested List Indentation

**Issue:** Numbered lists with nested bullet lists may have incorrect indentation in Markdown output.

**Example:**

```markdown
1. Numbered item
   - Nested bullet (may have wrong indentation)
```

**Status:** Known issue, may be Markdown rendering or block conversion issue

### Bookmark/Embed/Link Preview Rendering

**Issue:** Bookmark, embed, and link preview blocks render as simple links instead of rich previews.

**Workaround:** These blocks provide URL and caption in Advanced layer - implement custom rendering:

```typescript
const blocks = await notionCMS.getPageContent(pageId)
const advancedBlocks = await convertBlocksToAdvanced(blocks)

advancedBlocks.forEach((block) => {
  if (block.type === "bookmark") {
    // Custom rendering with fetch to get preview metadata
    renderRichPreview(block.url, block.caption_text)
  }
})
```

**Status:** By design - rich previews require external API calls

### Child Page/Database Blocks

**Issue:** Child page and child database blocks are skipped by default in Markdown/HTML conversion.

**Workaround:** Enable debug mode to see placeholders:

```typescript
const markdown = blocksToMarkdown(blocks, { debug: true })
// Shows: [child_page Page Title] [id: page-id]
```

**Status:** By design - these require additional API calls to resolve

### Table Support

**Note:** Tables are supported, but rendering may vary by Markdown processor. Some processors require specific table formatting.

**Status:** Fully supported - rendering depends on Markdown processor

## Unsupported Features

### Block Types Not Yet Supported

The following block types may exist in Notion but are not yet supported:

- Any block types that fall into the `default` case in converters
- Custom block types introduced in newer Notion API versions

**If you encounter an unsupported block:**

1. Check if it appears in debug mode output
2. Use Raw layer to access the complete block structure
3. Report the issue with block type information

### Property Types Not Yet Supported

- `button` - Button properties
- `verification` - Verification properties
- Properties introduced in newer Notion API versions

## Workarounds

### Accessing Unsupported Properties

If a property isn't supported in Simple/Advanced layers:

```typescript
// Use Raw layer
const record = await notionCMS
  .query("myDatabase", { recordType: "raw" })
  .single()

// Access property directly
const unsupportedProperty = record.properties["Unsupported Property"]
```

### Custom Block Rendering

For unsupported or partially supported blocks:

```typescript
const blocks = await notionCMS.getPageContent(pageId)
const advancedBlocks = await convertBlocksToAdvanced(blocks)

// Custom rendering logic
advancedBlocks.forEach((block) => {
  if (block.type === "unsupported_type") {
    // Implement custom rendering
  }
})
```

## Reporting Issues

When reporting unsupported features or bugs:

1. **Include block/property type** - The exact Notion type name
2. **Include layer** - Which API layer you're using (Simple/Advanced/Raw)
3. **Include error messages** - Any errors or warnings
4. **Include example data** - Sample Notion data structure (sanitized)

## Roadmap

Planned improvements (from roadmap.md):

- [ ] Formula type inference in Simple layer
- [ ] Status property support in Simple layer
- [ ] Enhanced bookmark/embed rendering
- [ ] Rollup processing and type conversion
- [ ] Support for newer Notion block types as they're released

## Version Compatibility

Notion CMS is built for:

- **Notion API Version:** 5.0+ (Data Sources API)
- **TypeScript:** 5.3+
- **Node.js:** 18+

Some features may not work with older Notion API versions or may require newer versions.

## Next Steps

- Review **[Core Concepts](./02-core-concepts.md)** - Understand API layers
- Check **[Examples](./07-examples.md)** - See workarounds in practice
- Explore the [monorepo](../../../apps/) - See how limitations are handled
