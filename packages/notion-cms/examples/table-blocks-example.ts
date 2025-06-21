/**
 * Example demonstrating complete table block support in NotionCMS
 * Phases 1-3: Basic extraction, Markdown conversion, and HTML conversion
 */

import { NotionCMS, SimpleTableBlock, SimpleTableRowBlock } from "../src/index";

// Initialize the CMS (you'll need a real token for actual use)
const cms = new NotionCMS(process.env.NOTION_TOKEN || "your-notion-token");

/**
 * Example function to process table blocks from a Notion page
 */
async function processTableBlocks(pageId: string) {
  try {
    console.log("🔍 Fetching page content...");

    // Get all blocks from a Notion page
    const blocks = await cms.getPageContent(pageId);

    // Find all table blocks
    const tableBlocks = blocks.filter(
      (block) => block.type === "table"
    ) as SimpleTableBlock[];

    console.log(`📊 Found ${tableBlocks.length} table(s)`);

    // Process each table
    tableBlocks.forEach((table, index) => {
      console.log(`\n--- Table ${index + 1} ---`);
      console.log(`📐 Dimensions: ${table.content.tableWidth} columns`);
      console.log(`📋 Has column header: ${table.content.hasColumnHeader}`);
      console.log(`📋 Has row header: ${table.content.hasRowHeader}`);

      // Process table rows
      if (table.children && table.children.length > 0) {
        console.log(`📝 Rows: ${table.children.length}`);

        table.children.forEach((row: SimpleTableRowBlock, rowIndex) => {
          console.log(`\n  Row ${rowIndex + 1}:`);
          row.content.cells.forEach((cell, cellIndex) => {
            console.log(`    Cell ${cellIndex + 1}: "${cell.plainText}"`);
          });
        });
      } else {
        console.log("📝 No rows found in this table");
      }
    });

    return tableBlocks;
  } catch (error) {
    console.error("❌ Error processing table blocks:", error);
    throw error;
  }
}

/**
 * Example function to extract table data as a simple array structure
 */
function extractTableData(tableBlock: SimpleTableBlock): string[][] {
  if (!tableBlock.children || tableBlock.children.length === 0) {
    return [];
  }

  return tableBlock.children.map((row: SimpleTableRowBlock) =>
    row.content.cells.map((cell) => cell.plainText)
  );
}

/**
 * Example function to format table data as a simple text table
 */
function formatTableAsText(tableBlock: SimpleTableBlock): string {
  const data = extractTableData(tableBlock);

  if (data.length === 0) {
    return "Empty table";
  }

  // Calculate column widths
  const columnWidths = Array(tableBlock.content.tableWidth).fill(0);
  data.forEach((row) => {
    row.forEach((cell, index) => {
      columnWidths[index] = Math.max(columnWidths[index], cell.length);
    });
  });

  // Format rows
  const formattedRows = data.map((row, rowIndex) => {
    const formattedCells = row.map((cell, cellIndex) =>
      cell.padEnd(columnWidths[cellIndex])
    );

    let rowText = `| ${formattedCells.join(" | ")} |`;

    // Add separator after header if this table has column headers
    if (tableBlock.content.hasColumnHeader && rowIndex === 0) {
      const separator = columnWidths
        .map((width) => "-".repeat(width))
        .join("-|-");
      rowText += `\n|-${separator}-|`;
    }

    return rowText;
  });

  return formattedRows.join("\n");
}

/**
 * Advanced example: Working with rich text in table cells
 */
function analyzeTableRichText(tableBlock: SimpleTableBlock) {
  console.log("\n🔍 Analyzing rich text in table cells...");

  if (!tableBlock.children || tableBlock.children.length === 0) {
    console.log("No rows to analyze");
    return;
  }

  tableBlock.children.forEach((row: SimpleTableRowBlock, rowIndex) => {
    row.content.cells.forEach((cell, cellIndex) => {
      // Access the full rich text data for advanced processing
      const richTextObjects = cell.richText;

      if (richTextObjects && richTextObjects.length > 0) {
        console.log(`\n  Row ${rowIndex + 1}, Cell ${cellIndex + 1}:`);
        console.log(`    Plain text: "${cell.plainText}"`);
        console.log(`    Rich text objects: ${richTextObjects.length}`);

        // Example: Check for formatting
        const hasFormatting = richTextObjects.some(
          (rt) =>
            rt.annotations &&
            (rt.annotations.bold ||
              rt.annotations.italic ||
              rt.annotations.underline ||
              rt.annotations.strikethrough ||
              rt.annotations.code)
        );

        if (hasFormatting) {
          console.log(`    ✨ Contains formatting`);
        }

        // Example: Check for links
        const hasLinks = richTextObjects.some((rt) => rt.href);
        if (hasLinks) {
          console.log(`    🔗 Contains links`);
        }
      }
    });
  });
}

/**
 * Phase 2: Convert tables to Markdown format
 */
async function convertTablesToMarkdown(pageId: string) {
  try {
    console.log("\n📝 Converting tables to Markdown...");

    const blocks = await cms.getPageContent(pageId);
    const tableBlocks = blocks.filter(
      (block) => block.type === "table"
    ) as SimpleTableBlock[];

    if (tableBlocks.length === 0) {
      console.log("No tables found on this page.");
      return "";
    }

    // Convert all tables to markdown
    const markdown = cms.blocksToMarkdown(tableBlocks);

    console.log("\n📄 Markdown Output:");
    console.log("---");
    console.log(markdown);
    console.log("---");

    return markdown;
  } catch (error) {
    console.error("❌ Error converting to Markdown:", error);
    return "";
  }
}

/**
 * Phase 3: Convert tables to HTML format
 */
async function convertTablesToHtml(pageId: string) {
  try {
    console.log("\n🌐 Converting tables to HTML...");

    const blocks = await cms.getPageContent(pageId);
    const tableBlocks = blocks.filter(
      (block) => block.type === "table"
    ) as SimpleTableBlock[];

    if (tableBlocks.length === 0) {
      console.log("No tables found on this page.");
      return "";
    }

    // Convert all tables to HTML
    const html = cms.blocksToHtml(tableBlocks);

    console.log("\n🌐 HTML Output:");
    console.log("---");
    console.log(html);
    console.log("---");

    return html;
  } catch (error) {
    console.error("❌ Error converting to HTML:", error);
    return "";
  }
}

/**
 * Complete example: Demonstrate all table features
 */
async function demonstrateAllFeatures(pageId: string) {
  try {
    console.log("🚀 Demonstrating all table features...\n");

    // 1. Basic table processing
    console.log("=== Phase 1: Basic Table Processing ===");
    const tables = await processTableBlocks(pageId);

    if (tables.length === 0) {
      console.log("No tables found to demonstrate other features.");
      return;
    }

    console.log("\n=== Phase 2: Markdown Conversion ===");
    await convertTablesToMarkdown(pageId);

    console.log("\n=== Phase 3: HTML Conversion ===");
    await convertTablesToHtml(pageId);

    console.log("\n=== Advanced: Rich Text Analysis ===");
    analyzeTableRichText(tables[0]);

    console.log("\n✅ All table features demonstrated!");
  } catch (error) {
    console.error("❌ Error in demonstration:", error);
  }
}

/**
 * Example with mock data (for testing without API calls)
 */
function mockTableExample() {
  console.log("🧪 Mock Table Example...\n");

  // Create a mock table block
  const mockTable: SimpleTableBlock = {
    id: "mock-table-1",
    type: "table",
    content: {
      tableWidth: 3,
      hasColumnHeader: true,
      hasRowHeader: false,
    },
    children: [
      {
        id: "row-1",
        type: "table_row",
        content: {
          cells: [
            { plainText: "Feature", richText: [] },
            { plainText: "Status", richText: [] },
            { plainText: "Priority", richText: [] },
          ],
        },
        hasChildren: false,
      },
      {
        id: "row-2",
        type: "table_row",
        content: {
          cells: [
            { plainText: "Table Support", richText: [] },
            { plainText: "Complete", richText: [] },
            { plainText: "High", richText: [] },
          ],
        },
        hasChildren: false,
      },
      {
        id: "row-3",
        type: "table_row",
        content: {
          cells: [
            { plainText: "Markdown Export", richText: [] },
            { plainText: "Complete", richText: [] },
            { plainText: "High", richText: [] },
          ],
        },
        hasChildren: false,
      },
    ] as SimpleTableRowBlock[],
    hasChildren: true,
  };

  console.log("📊 Mock Table Data:");
  console.log(`Columns: ${mockTable.content.tableWidth}`);
  console.log(`Rows: ${mockTable.children.length}`);
  console.log(`Has headers: ${mockTable.content.hasColumnHeader}`);

  console.log("\n📝 Markdown Output:");
  const markdown = cms.blocksToMarkdown([mockTable]);
  console.log(markdown);

  console.log("\n🌐 HTML Output:");
  const html = cms.blocksToHtml([mockTable]);
  console.log(html);
}

// Export functions for use in other modules
export {
  processTableBlocks,
  extractTableData,
  formatTableAsText,
  analyzeTableRichText,
  convertTablesToMarkdown,
  convertTablesToHtml,
  demonstrateAllFeatures,
  mockTableExample,
};

// Example usage
if (require.main === module) {
  // For testing with mock data (no API required)
  console.log("Running mock example...");
  mockTableExample();

  // For real API usage, uncomment below:
  // const pageId = 'your-page-id-here'; // Replace with actual page ID
  // demonstrateAllFeatures(pageId);
}
