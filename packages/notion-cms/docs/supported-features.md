# Supported Features

This document outlines which Notion database properties and content blocks are currently supported by the `notion-cms` package.

## Database Properties

Database properties are the fields/columns in Notion databases that can be queried, filtered, and accessed through the library.

### ✅ Fully Supported Properties

These properties are fully supported with proper type conversion, querying, and filtering:

| Property Type        | Support Level | TypeScript Type                                                     | Notes                                                  |
| -------------------- | ------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **title**            | Full          | `string`                                                            | Primary text field                                     |
| **rich_text**        | Full          | `string`                                                            | Multi-line text with formatting                        |
| **url**              | Full          | `string`                                                            | Web URLs                                               |
| **email**            | Full          | `string`                                                            | Email addresses                                        |
| **phone_number**     | Full          | `string`                                                            | Phone numbers                                          |
| **number**           | Full          | `number`                                                            | Numeric values                                         |
| **select**           | Full          | `string` or union type                                              | Single selection, type-safe options when configured    |
| **multi_select**     | Full          | `string[]` or union array                                           | Multiple selections, type-safe options when configured |
| **date**             | Full          | `Date`                                                              | Date and datetime values                               |
| **people**           | Full          | `string[]`                                                          | User references (returns user IDs)                     |
| **files**            | Full          | `{ name: string; url: string; }[]`                                  | File attachments                                       |
| **checkbox**         | Full          | `boolean`                                                           | Boolean values                                         |
| **relation**         | Full          | `string[]`                                                          | Related page IDs                                       |
| **created_time**     | Full          | `string`                                                            | Auto-generated creation timestamp                      |
| **last_edited_time** | Full          | `string`                                                            | Auto-generated modification timestamp                  |
| **created_by**       | Full          | `{ id: string; name: string \| null; avatar_url: string \| null; }` | User who created the page                              |
| **last_edited_by**   | Full          | `{ id: string; name: string \| null; avatar_url: string \| null; }` | User who last edited the page                          |
| **status**           | Full          | `string`                                                            | Status field values                                    |
| **unique_id**        | Full          | `string`                                                            | Unique identifier values                               |

### ⚠️ Partially Supported Properties

These properties can be synced and accessed but have limitations:

| Property Type | Support Level | TypeScript Type | Limitations                                                                                                                                     |
| ------------- | ------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **formula**   | Partial       | `any`           | Can sync but not properly parsed or queried by result type. Formula results are returned as-is from Notion API without type-specific processing |
| **rollup**    | Partial       | `any`           | Can sync but type depends on rollup configuration and source property                                                                           |

### ❌ Unsupported Properties

These properties are not currently supported:

| Property Type    | Status        | Reason                                               |
| ---------------- | ------------- | ---------------------------------------------------- |
| **verification** | Not Supported | No implementation for verification property handling |

## Content Blocks

Content blocks are the building blocks of Notion pages that can be extracted and converted to Markdown or HTML.

### ✅ Fully Supported Blocks

These blocks are fully supported with conversion to both Markdown and HTML:

| Block Type             | Markdown | HTML | Notes                                           |
| ---------------------- | -------- | ---- | ----------------------------------------------- |
| **paragraph**          | ✅       | ✅   | Basic text paragraphs                           |
| **heading_1**          | ✅       | ✅   | H1 headings (`# Title`)                         |
| **heading_2**          | ✅       | ✅   | H2 headings (`## Title`)                        |
| **heading_3**          | ✅       | ✅   | H3 headings (`### Title`)                       |
| **bulleted_list_item** | ✅       | ✅   | Unordered lists with proper nesting             |
| **numbered_list_item** | ✅       | ✅   | Ordered lists with proper numbering             |
| **to_do**              | ✅       | ✅   | Task lists with checkboxes                      |
| **toggle**             | ✅       | ✅   | Collapsible sections (uses `<details>` in HTML) |
| **quote**              | ✅       | ✅   | Block quotes                                    |
| **code**               | ✅       | ✅   | Code blocks with language support               |
| **callout**            | ✅       | ✅   | Highlighted callout boxes with icons            |
| **divider**            | ✅       | ✅   | Horizontal rules                                |
| **image**              | ✅       | ✅   | Images with captions and URL extraction         |
| **bookmark**           | ✅       | ✅   | Web bookmarks as links                          |
| **embed**              | ✅       | ✅   | Embedded content as links                       |
| **link_preview**       | ✅       | ✅   | Link previews as links                          |

### ⚠️ Partially Supported Blocks

These blocks have limited support:

| Block Type            | Support Level | Limitations                                                                        |
| --------------------- | ------------- | ---------------------------------------------------------------------------------- |
| **file**              | Partial       | URL extraction only, no file content processing                                    |
| **pdf**               | Partial       | URL extraction only, no PDF content processing                                     |
| **video**             | Partial       | URL extraction only, no video embedding                                            |
| **audio**             | Partial       | URL extraction only, no audio embedding                                            |
| **table**             | Partial       | Structure metadata only (width, headers), table content (rows/cells) not extracted |
| **equation**          | Partial       | Placeholder only, no LaTeX rendering                                               |
| **table_of_contents** | Partial       | Placeholder only, no TOC generation                                                |
| **column_list**       | Partial       | Structure only, content handled through children                                   |
| **column**            | Partial       | Structure only, content handled through children                                   |

### ❌ Unsupported Blocks

These blocks are not currently supported and will show as comments in output:

| Block Type         | Status        | Notes                                    |
| ------------------ | ------------- | ---------------------------------------- |
| **table_row**      | Not Supported | Table content extraction not implemented |
| **synced_block**   | Not Supported | Synced content blocks not supported      |
| **template**       | Not Supported | Template blocks not supported            |
| **breadcrumb**     | Not Supported | Navigation breadcrumbs not supported     |
| **child_page**     | Not Supported | Embedded child pages not supported       |
| **child_database** | Not Supported | Embedded child databases not supported   |
| **link_to_page**   | Not Supported | Internal page links not supported        |
| **mention**        | Not Supported | User/page mentions not supported         |

## Feature Status Summary

- **Database Properties**: 16/18 supported (89%)
- **Content Blocks**: 15/27 blocks fully supported (56%), 9/27 partially supported (33%)

## Contributing

If you need support for any of the unsupported features, please:

1. Open an issue on the repository describing your use case
2. Check the [roadmap](../roadmap.md) to see if the feature is planned
3. Consider contributing a pull request if you'd like to implement the feature

## Notes

- **Rich Text**: All text-based blocks support Notion's rich text formatting (bold, italic, code, links, etc.) but are converted to plain text in the current implementation
- **File URLs**: Notion serves files with short-lived AWS tokens. Consider your caching strategy when working with file URLs
- **Type Safety**: Database properties support full TypeScript type safety when using the query builder with field metadata
- **Pagination**: All database queries support automatic pagination for large datasets
- **Filtering**: All supported database properties can be used in query filters with appropriate operators

Last updated: January 2024
