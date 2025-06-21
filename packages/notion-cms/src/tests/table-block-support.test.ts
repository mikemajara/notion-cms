/**
 * Test file for table block support implementation (Phase 1)
 * Tests basic table and table_row block extraction
 */

import { NotionCMS } from "../index";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

describe("Table Block Support - Phase 1", () => {
  let cms: NotionCMS;

  beforeEach(() => {
    // Create a mock CMS instance for testing
    cms = new NotionCMS("mock-token");
  });

  describe("extractBlockContent", () => {
    it("should extract table block content correctly", () => {
      // Mock table block from Notion API
      const mockTableBlock: BlockObjectResponse = {
        object: "block",
        id: "table-block-id",
        parent: { type: "page_id", page_id: "parent-page-id" },
        created_time: "2023-01-01T00:00:00.000Z",
        last_edited_time: "2023-01-01T00:00:00.000Z",
        created_by: { object: "user", id: "user-id" },
        last_edited_by: { object: "user", id: "user-id" },
        has_children: true,
        archived: false,
        in_trash: false,
        type: "table",
        table: {
          table_width: 3,
          has_column_header: true,
          has_row_header: false,
        },
      } as BlockObjectResponse;

      // Access the private method for testing
      const result = (cms as any).extractBlockContent(mockTableBlock);

      expect(result).toEqual({
        tableWidth: 3,
        hasColumnHeader: true,
        hasRowHeader: false,
      });
    });

    it("should extract table_row block content correctly", () => {
      // Mock table_row block from Notion API
      const mockTableRowBlock: BlockObjectResponse = {
        object: "block",
        id: "table-row-block-id",
        parent: { type: "block_id", block_id: "table-block-id" },
        created_time: "2023-01-01T00:00:00.000Z",
        last_edited_time: "2023-01-01T00:00:00.000Z",
        created_by: { object: "user", id: "user-id" },
        last_edited_by: { object: "user", id: "user-id" },
        has_children: false,
        archived: false,
        in_trash: false,
        type: "table_row",
        table_row: {
          cells: [
            [
              {
                type: "text",
                text: {
                  content: "Header 1",
                  link: null,
                },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: "Header 1",
                href: null,
              },
            ],
            [
              {
                type: "text",
                text: {
                  content: "Header 2",
                  link: null,
                },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: "Header 2",
                href: null,
              },
            ],
            [
              {
                type: "text",
                text: {
                  content: "Header 3",
                  link: null,
                },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: "Header 3",
                href: null,
              },
            ],
          ],
        },
      } as BlockObjectResponse;

      // Access the private method for testing
      const result = (cms as any).extractBlockContent(mockTableRowBlock);

      expect(result).toEqual({
        cells: [
          {
            plainText: "Header 1",
            richText: [
              {
                type: "text",
                text: {
                  content: "Header 1",
                  link: null,
                },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: "Header 1",
                href: null,
              },
            ],
          },
          {
            plainText: "Header 2",
            richText: [
              {
                type: "text",
                text: {
                  content: "Header 2",
                  link: null,
                },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: "Header 2",
                href: null,
              },
            ],
          },
          {
            plainText: "Header 3",
            richText: [
              {
                type: "text",
                text: {
                  content: "Header 3",
                  link: null,
                },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: "Header 3",
                href: null,
              },
            ],
          },
        ],
      });
    });

    it("should handle empty table row cells", () => {
      const mockEmptyTableRowBlock: BlockObjectResponse = {
        object: "block",
        id: "empty-table-row-block-id",
        parent: { type: "block_id", block_id: "table-block-id" },
        created_time: "2023-01-01T00:00:00.000Z",
        last_edited_time: "2023-01-01T00:00:00.000Z",
        created_by: { object: "user", id: "user-id" },
        last_edited_by: { object: "user", id: "user-id" },
        has_children: false,
        archived: false,
        in_trash: false,
        type: "table_row",
        table_row: {
          cells: [[], [], []],
        },
      } as BlockObjectResponse;

      const result = (cms as any).extractBlockContent(mockEmptyTableRowBlock);

      expect(result).toEqual({
        cells: [
          { plainText: "", richText: [] },
          { plainText: "", richText: [] },
          { plainText: "", richText: [] },
        ],
      });
    });
  });

  describe("simplifyBlock", () => {
    it("should create a SimpleBlock for table blocks", () => {
      const mockTableBlock: BlockObjectResponse = {
        object: "block",
        id: "table-block-id",
        parent: { type: "page_id", page_id: "parent-page-id" },
        created_time: "2023-01-01T00:00:00.000Z",
        last_edited_time: "2023-01-01T00:00:00.000Z",
        created_by: { object: "user", id: "user-id" },
        last_edited_by: { object: "user", id: "user-id" },
        has_children: true,
        archived: false,
        in_trash: false,
        type: "table",
        table: {
          table_width: 2,
          has_column_header: false,
          has_row_header: true,
        },
      } as BlockObjectResponse;

      const result = (cms as any).simplifyBlock(mockTableBlock);

      expect(result.id).toBe("table-block-id");
      expect(result.type).toBe("table");
      expect(result.hasChildren).toBe(true);
      expect(result.content).toEqual({
        tableWidth: 2,
        hasColumnHeader: false,
        hasRowHeader: true,
      });
    });

    it("should create a SimpleBlock for table_row blocks", () => {
      const mockTableRowBlock: BlockObjectResponse = {
        object: "block",
        id: "table-row-block-id",
        parent: { type: "block_id", block_id: "table-block-id" },
        created_time: "2023-01-01T00:00:00.000Z",
        last_edited_time: "2023-01-01T00:00:00.000Z",
        created_by: { object: "user", id: "user-id" },
        last_edited_by: { object: "user", id: "user-id" },
        has_children: false,
        archived: false,
        in_trash: false,
        type: "table_row",
        table_row: {
          cells: [
            [
              {
                type: "text",
                text: { content: "Cell 1", link: null },
                plain_text: "Cell 1",
                href: null,
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
              },
            ],
            [
              {
                type: "text",
                text: { content: "Cell 2", link: null },
                plain_text: "Cell 2",
                href: null,
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
              },
            ],
          ],
        },
      } as BlockObjectResponse;

      const result = (cms as any).simplifyBlock(mockTableRowBlock);

      expect(result.id).toBe("table-row-block-id");
      expect(result.type).toBe("table_row");
      expect(result.hasChildren).toBe(false);
      expect(result.content.cells).toHaveLength(2);
      expect(result.content.cells[0].plainText).toBe("Cell 1");
      expect(result.content.cells[1].plainText).toBe("Cell 2");
    });
  });
});
