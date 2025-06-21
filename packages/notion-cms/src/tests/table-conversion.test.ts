/**
 * Test file for table block conversion (Phases 2-3)
 * Tests markdown and HTML conversion of table blocks
 */

import { NotionCMS, SimpleTableBlock, SimpleTableRowBlock } from "../index";

describe("Table Block Conversion - Phases 2-3", () => {
  let cms: NotionCMS;

  beforeEach(() => {
    cms = new NotionCMS("mock-token");
  });

  describe("Phase 2: Markdown Conversion", () => {
    describe("tableToMarkdown", () => {
      it("should convert table to markdown with headers", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
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
                  { plainText: "Name", richText: [] },
                  { plainText: "Age", richText: [] },
                  { plainText: "City", richText: [] },
                ],
              },
              hasChildren: false,
            },
            {
              id: "row-2",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "John", richText: [] },
                  { plainText: "25", richText: [] },
                  { plainText: "NYC", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        // Access private method for testing
        const result = (cms as any).tableToMarkdown(mockTableBlock, "");

        expect(result).toBe(`| Name | Age | City |
| --- | --- | --- |
| John | 25 | NYC |`);
      });

      it("should convert table to markdown without headers (but still include separator)", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
            hasColumnHeader: false,
            hasRowHeader: false,
          },
          children: [
            {
              id: "row-1",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "Data 1", richText: [] },
                  { plainText: "Data 2", richText: [] },
                ],
              },
              hasChildren: false,
            },
            {
              id: "row-2",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "Data 3", richText: [] },
                  { plainText: "Data 4", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = (cms as any).tableToMarkdown(mockTableBlock, "");

        expect(result).toBe(`| Data 1 | Data 2 |
| --- | --- |
| Data 3 | Data 4 |`);
      });

      it("should handle empty table", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
            hasColumnHeader: false,
            hasRowHeader: false,
          },
          children: [],
          hasChildren: false,
        };

        const result = (cms as any).tableToMarkdown(mockTableBlock, "");
        expect(result).toBe("<!-- Empty table -->");
      });

      it("should handle indentation correctly", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
            hasColumnHeader: true,
            hasRowHeader: false,
          },
          children: [
            {
              id: "row-1",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "Col 1", richText: [] },
                  { plainText: "Col 2", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = (cms as any).tableToMarkdown(mockTableBlock, "  ");

        expect(result).toBe(`  | Col 1 | Col 2 |
  | --- | --- |`);
      });

      it("should handle empty cells", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
            hasColumnHeader: false,
            hasRowHeader: false,
          },
          children: [
            {
              id: "row-1",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "", richText: [] },
                  { plainText: "Data", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = (cms as any).tableToMarkdown(mockTableBlock, "");
        expect(result).toBe(`|  | Data |
| --- | --- |`);
      });
    });

    describe("blockToMarkdown integration", () => {
      it("should handle table blocks in blockToMarkdown", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
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
                ],
              },
              hasChildren: false,
            },
            {
              id: "row-2",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "Tables", richText: [] },
                  { plainText: "Complete", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = cms.blocksToMarkdown([mockTableBlock]);
        expect(result).toBe(`| Feature | Status |
| --- | --- |
| Tables | Complete |`);
      });

      it("should skip table_row blocks when processed individually", () => {
        const mockTableRowBlock: SimpleTableRowBlock = {
          id: "row-1",
          type: "table_row",
          content: {
            cells: [{ plainText: "Data", richText: [] }],
          },
          hasChildren: false,
        };

        const result = cms.blocksToMarkdown([mockTableRowBlock]);
        expect(result).toBe("");
      });
    });
  });

  describe("Phase 3: HTML Conversion", () => {
    describe("tableToHtml", () => {
      it("should convert table to HTML with headers", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
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
                  { plainText: "Name", richText: [] },
                  { plainText: "Age", richText: [] },
                  { plainText: "City", richText: [] },
                ],
              },
              hasChildren: false,
            },
            {
              id: "row-2",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "John", richText: [] },
                  { plainText: "25", richText: [] },
                  { plainText: "NYC", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = (cms as any).tableToHtml(mockTableBlock);

        expect(result).toBe(
          "<table><thead><tr><th>Name</th><th>Age</th><th>City</th></tr></thead><tbody><tr><td>John</td><td>25</td><td>NYC</td></tr></tbody></table>"
        );
      });

      it("should convert table to HTML without headers", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
            hasColumnHeader: false,
            hasRowHeader: false,
          },
          children: [
            {
              id: "row-1",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "Data 1", richText: [] },
                  { plainText: "Data 2", richText: [] },
                ],
              },
              hasChildren: false,
            },
            {
              id: "row-2",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "Data 3", richText: [] },
                  { plainText: "Data 4", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = (cms as any).tableToHtml(mockTableBlock);

        expect(result).toBe(
          "<table><tr><td>Data 1</td><td>Data 2</td></tr><tr><td>Data 3</td><td>Data 4</td></tr></table>"
        );
      });

      it("should handle empty table", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
            hasColumnHeader: false,
            hasRowHeader: false,
          },
          children: [],
          hasChildren: false,
        };

        const result = (cms as any).tableToHtml(mockTableBlock);
        expect(result).toBe("<!-- Empty table -->");
      });

      it("should handle single header row", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
            hasColumnHeader: true,
            hasRowHeader: false,
          },
          children: [
            {
              id: "row-1",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "Col 1", richText: [] },
                  { plainText: "Col 2", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = (cms as any).tableToHtml(mockTableBlock);

        expect(result).toBe(
          "<table><thead><tr><th>Col 1</th><th>Col 2</th></tr></thead></table>"
        );
      });

      it("should handle empty cells", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
            hasColumnHeader: false,
            hasRowHeader: false,
          },
          children: [
            {
              id: "row-1",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "", richText: [] },
                  { plainText: "Data", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = (cms as any).tableToHtml(mockTableBlock);
        expect(result).toBe("<table><tr><td></td><td>Data</td></tr></table>");
      });
    });

    describe("blockToHtml integration", () => {
      it("should handle table blocks in blockToHtml", () => {
        const mockTableBlock: SimpleTableBlock = {
          id: "table-1",
          type: "table",
          content: {
            tableWidth: 2,
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
                ],
              },
              hasChildren: false,
            },
            {
              id: "row-2",
              type: "table_row",
              content: {
                cells: [
                  { plainText: "Tables", richText: [] },
                  { plainText: "Complete", richText: [] },
                ],
              },
              hasChildren: false,
            },
          ] as SimpleTableRowBlock[],
          hasChildren: true,
        };

        const result = cms.blocksToHtml([mockTableBlock]);
        expect(result).toBe(
          "<table><thead><tr><th>Feature</th><th>Status</th></tr></thead><tbody><tr><td>Tables</td><td>Complete</td></tr></tbody></table>"
        );
      });

      it("should skip table_row blocks when processed individually", () => {
        const mockTableRowBlock: SimpleTableRowBlock = {
          id: "row-1",
          type: "table_row",
          content: {
            cells: [{ plainText: "Data", richText: [] }],
          },
          hasChildren: false,
        };

        const result = cms.blocksToHtml([mockTableRowBlock]);
        expect(result).toBe("");
      });
    });
  });
});
