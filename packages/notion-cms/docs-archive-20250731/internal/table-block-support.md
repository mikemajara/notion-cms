# Table Block Support - Complete Implementation (Phases 1-3)

## Overview

This document describes the complete implementation of simple table block support in NotionCMS. All three phases are now implemented, providing comprehensive table support from basic extraction to full conversion capabilities.

## ✅ What's Implemented

### 🆕 Block Type Support

- **Table blocks (`table`)**: Extract table metadata including width, headers
- **Table row blocks (`table_row`)**: Extract cell data with both plain text and rich text

### 🔧 Core Changes

#### Phase 1: Enhanced Block Content Extraction

Added support for `table_row` blocks in `extractBlockContent()`:

```typescript
case "table_row":
  return {
    cells: typeData.cells.map((cell: any[]) => ({
      plainText: this.extractRichText(cell),
      richText: cell,
    })),
  };
```

#### 2. TypeScript Interfaces

```typescript
interface TableBlockContent {
  tableWidth: number;
  hasColumnHeader: boolean;
  hasRowHeader: boolean;
}

interface TableRowCell {
  plainText: string;
  richText: any[];
}

interface TableRowBlockContent {
  cells: TableRowCell[];
}

interface SimpleTableBlock extends SimpleBlock {
  type: "table";
  content: TableBlockContent;
  children: SimpleTableRowBlock[];
}

interface SimpleTableRowBlock extends SimpleBlock {
  type: "table_row";
  content: TableRowBlockContent;
}
```

## Simple API Layer Representation

Tables are represented as hierarchical blocks where:

- **Table block** contains metadata and has `table_row` blocks as children
- **Table row blocks** contain an array of cells with both plain text and rich text

### Example Usage

```typescript
import { NotionCMS, SimpleTableBlock } from "@mikemajara/notion-cms";

const cms = new NotionCMS("your-token");

// Get page content
const blocks = await cms.getPageContent("page-id");

// Find table blocks
const tableBlocks = blocks.filter(
  (block) => block.type === "table"
) as SimpleTableBlock[];

// Access table data
tableBlocks.forEach((table) => {
  console.log(`Table: ${table.content.tableWidth} columns`);
  console.log(`Has headers: ${table.content.hasColumnHeader}`);

  // Access rows
  table.children.forEach((row) => {
    row.content.cells.forEach((cell) => {
      console.log(`Cell: ${cell.plainText}`);
      // Access rich text: cell.richText
    });
  });
});
```

## Advanced API Layer Representation

The advanced API layer provides access to:

- **Full rich text objects** with formatting annotations
- **Cell-level metadata** like text color, formatting
- **Link information** in table cells

### Example: Accessing Rich Text

```typescript
// Access rich text formatting in table cells
table.children.forEach((row) => {
  row.content.cells.forEach((cell) => {
    cell.richText.forEach((richTextObj) => {
      if (richTextObj.annotations?.bold) {
        console.log("This text is bold:", richTextObj.plain_text);
      }
      if (richTextObj.href) {
        console.log("This text has a link:", richTextObj.href);
      }
    });
  });
});
```

## How Tables Work in Notion API

1. **Table structure**: Tables are parent blocks that contain `table_row` children
2. **Table metadata**: Stored in the table block (width, headers)
3. **Content**: Stored in individual `table_row` blocks
4. **Fetching**: The existing recursive block fetching automatically retrieves table rows

## Testing

Comprehensive tests verify:

- ✅ Table block content extraction
- ✅ Table row block content extraction
- ✅ Empty cell handling
- ✅ SimpleBlock creation for both types
- ✅ Rich text preservation

Run tests:

```bash
pnpm test table-block-support
```

#### Phase 2: Markdown Table Conversion

Added `tableToMarkdown()` method that converts table blocks to GitHub-flavored Markdown:

```typescript
case "table":
  markdown = this.tableToMarkdown(block as SimpleTableBlock, baseIndent);
  break;
```

Features:

- ✅ GitHub-flavored Markdown table format
- ✅ **Always includes header separator row** (required for valid Markdown tables)
- ✅ Works with and without Notion column headers
- ✅ Proper indentation support for nested contexts
- ✅ Empty table handling

#### Phase 3: HTML Table Conversion

Added `tableToHtml()` method that generates semantic HTML:

```typescript
case "table":
  html = this.tableToHtml(block as SimpleTableBlock);
  break;
```

Features:

- ✅ Semantic HTML with `<table>`, `<thead>`, `<tbody>` structure
- ✅ Proper `<th>` and `<td>` cell types
- ✅ Column header support
- ✅ Empty table handling

## ✅ What's Now Included (Phases 1-3)

- ✅ Table block content extraction
- ✅ Table row block content extraction
- ✅ **Markdown table conversion**
- ✅ **HTML table conversion**
- ✅ Rich text preservation
- ✅ Comprehensive testing

## What's NOT Included (Future Phases)

- ❌ Table editing operations
- ❌ Advanced table features (merged cells, etc.)
- ❌ Row header support (only column headers)
- ❌ Custom table styling/CSS classes

## Migration Notes

- **Backward compatible**: Existing code continues to work
- **No breaking changes**: All existing interfaces preserved
- **Type safety**: New interfaces provide proper TypeScript support
- **New features**: Markdown and HTML conversion available immediately

## Example Use Cases

### 1. **Phase 2**: Markdown Conversion

```typescript
// Convert all tables in a page to Markdown
const blocks = await cms.getPageContent("page-id");
const markdown = cms.blocksToMarkdown(blocks);

console.log(markdown);
// Output (with Notion headers):
// | Name | Age | City |
// | --- | --- | --- |
// | John | 25 | NYC |
// | Jane | 30 | LA |

// Output (without Notion headers - still valid Markdown):
// | Parameter | Type | Required |
// | --- | --- | --- |
// | databaseId | string | Yes |
```

**Important**: All tables always include the header separator row (`| --- |`) regardless of whether the original Notion table has column headers. This ensures valid Markdown table format.

### 2. **Phase 3**: HTML Conversion

```typescript
// Convert all tables in a page to HTML
const blocks = await cms.getPageContent("page-id");
const html = cms.blocksToHtml(blocks);

console.log(html);
// Output:
// <table>
//   <thead><tr><th>Name</th><th>Age</th><th>City</th></tr></thead>
//   <tbody>
//     <tr><td>John</td><td>25</td><td>NYC</td></tr>
//     <tr><td>Jane</td><td>30</td><td>LA</td></tr>
//   </tbody>
// </table>
```

### 3. Data Extraction

```typescript
function extractTableData(tableBlock: SimpleTableBlock): string[][] {
  return tableBlock.children.map((row) =>
    row.content.cells.map((cell) => cell.plainText)
  );
}
```

### 4. Rich Text Analysis

```typescript
function findLinksInTable(tableBlock: SimpleTableBlock): string[] {
  const links: string[] = [];

  tableBlock.children.forEach((row) => {
    row.content.cells.forEach((cell) => {
      cell.richText.forEach((rt) => {
        if (rt.href) links.push(rt.href);
      });
    });
  });

  return links;
}
```

### 5. CSV Export

```typescript
function convertToCSV(tableBlock: SimpleTableBlock): string {
  const data = extractTableData(tableBlock);
  return data.map((row) => `"${row.join('","')}"`).join("\n");
}
```

## Complete Feature Set

✅ **All phases implemented** - From basic extraction to full conversion support

---

_Last updated: January 2024_
