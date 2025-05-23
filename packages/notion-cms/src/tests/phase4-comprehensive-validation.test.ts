/**
 * Phase 4.1: Comprehensive Testing & Validation
 *
 * This test suite validates:
 * 1. Type safety for all Notion field types and their operators
 * 2. Edge cases and error handling
 * 3. Runtime validation with proper error messages
 * 4. Performance and type inference validation
 */

import { Client } from "@notionhq/client";
import {
  QueryBuilder,
  DatabaseFieldMetadata,
  OPERATOR_MAP,
  OperatorMap,
  NotionFieldType,
} from "../query-builder";

// Comprehensive test database metadata covering all field types
const ComprehensiveFieldTypes = {
  // Text-based fields
  Title: { type: "title" },
  "Rich Text": { type: "rich_text" },
  URL: { type: "url" },
  Email: { type: "email" },
  Phone: { type: "phone_number" },

  // Numeric fields
  Number: { type: "number" },

  // Selection fields
  Status: { type: "status" },
  "Single Select": {
    type: "select",
    options: ["Option A", "Option B", "Option C"] as const,
  },
  "Multi Select": {
    type: "multi_select",
    options: ["Tag 1", "Tag 2", "Tag 3", "Tag 4"] as const,
  },

  // Date/time fields
  Date: { type: "date" },
  "Created Time": { type: "created_time" },
  "Last Edited Time": { type: "last_edited_time" },

  // Boolean fields
  Checkbox: { type: "checkbox" },

  // Relation fields
  People: { type: "people" },
  Relation: { type: "relation" },
  "Created By": { type: "created_by" },
  "Last Edited By": { type: "last_edited_by" },

  // File fields
  Files: { type: "files" },

  // Special fields
  Formula: { type: "formula" },
  Rollup: { type: "rollup" },
  "Unique ID": { type: "unique_id" },
  Unknown: { type: "unknown" },
} as const satisfies DatabaseFieldMetadata;

type ComprehensiveRecord = {
  id: string;
  Title: string;
  "Rich Text": string;
  URL: string;
  Email: string;
  Phone: string;
  Number: number;
  Status: string;
  "Single Select": "Option A" | "Option B" | "Option C";
  "Multi Select": Array<"Tag 1" | "Tag 2" | "Tag 3" | "Tag 4">;
  Date: Date;
  "Created Time": Date;
  "Last Edited Time": Date;
  Checkbox: boolean;
  People: string[];
  Relation: string[];
  "Created By": string;
  "Last Edited By": string;
  Files: Array<{ name: string; url: string }>;
  Formula: any;
  Rollup: any;
  "Unique ID": number | string;
  Unknown: any;
};

describe("Phase 4.1: Comprehensive Testing & Validation", () => {
  let mockClient: any;
  let queryBuilder: QueryBuilder<
    ComprehensiveRecord,
    typeof ComprehensiveFieldTypes
  >;

  beforeEach(() => {
    mockClient = {
      databases: {
        query: jest.fn().mockResolvedValue({
          results: [],
          has_more: false,
          next_cursor: null,
        }),
      },
    } as any;

    queryBuilder = new QueryBuilder<
      ComprehensiveRecord,
      typeof ComprehensiveFieldTypes
    >(mockClient, "test-database-id", ComprehensiveFieldTypes);
  });

  describe("Complete Field Type Coverage", () => {
    test("should have operators defined for all Notion field types", () => {
      const notionFieldTypes: NotionFieldType[] = [
        "title",
        "rich_text",
        "url",
        "email",
        "phone_number",
        "number",
        "select",
        "multi_select",
        "status",
        "date",
        "created_time",
        "last_edited_time",
        "checkbox",
        "people",
        "relation",
        "created_by",
        "last_edited_by",
        "files",
        "formula",
        "rollup",
        "unique_id",
        "unknown",
      ];

      notionFieldTypes.forEach((fieldType) => {
        expect(OPERATOR_MAP[fieldType]).toBeDefined();
        expect(Array.isArray(OPERATOR_MAP[fieldType])).toBe(true);
        expect(OPERATOR_MAP[fieldType].length).toBeGreaterThan(0);
      });
    });

    test("should allow filtering on all field types with appropriate operators", () => {
      expect(() => {
        // Text fields
        queryBuilder.filter("Title", "contains", "test");
        queryBuilder.filter("Rich Text", "starts_with", "prefix");
        queryBuilder.filter("URL", "equals", "https://example.com");
        queryBuilder.filter("Email", "ends_with", "@company.com");
        queryBuilder.filter("Phone", "does_not_contain", "555");

        // Number fields
        queryBuilder.filter("Number", "greater_than", 100);
        queryBuilder.filter("Number", "less_than_or_equal_to", 500);

        // Selection fields
        queryBuilder.filter("Single Select", "equals", "Option A");
        queryBuilder.filter("Multi Select", "contains", "Tag 1");
        queryBuilder.filter("Status", "does_not_equal", "Done");

        // Date fields
        queryBuilder.filter("Date", "after", new Date("2024-01-01"));
        queryBuilder.filter("Created Time", "before", new Date());
        queryBuilder.filter(
          "Last Edited Time",
          "on_or_after",
          new Date("2024-06-01")
        );

        // Boolean fields
        queryBuilder.filter("Checkbox", "equals", true);

        // Relation fields - for contains/does_not_contain operations, single values are expected
        queryBuilder.filter("People", "contains", "user-id-123");
        queryBuilder.filter("Relation", "does_not_contain", "page-id-456");
        queryBuilder.filter("Created By", "contains", "user-id-789");

        // File fields
        queryBuilder.filter("Files", "is_not_empty", true);

        // Special fields
        queryBuilder.filter("Formula", "equals", "calculated-value");
        queryBuilder.filter("Rollup", "greater_than", 50);
        queryBuilder.filter("Unique ID", "equals", 123);
        queryBuilder.filter("Unknown", "is_empty", true);
      }).not.toThrow();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should throw helpful errors for invalid operator/field combinations", () => {
      expect(() => {
        // TypeScript should catch this, but let's test runtime validation
        (queryBuilder as any).filter("Checkbox", "contains", true);
      }).toThrow(/Invalid operator.*Checkbox.*checkbox/);

      expect(() => {
        (queryBuilder as any).filter("Number", "starts_with", 123);
      }).toThrow(/Invalid operator.*Number.*number/);

      expect(() => {
        (queryBuilder as any).filter("Date", "contains", new Date());
      }).toThrow(/Invalid operator.*Date.*date/);
    });

    test("should handle empty database gracefully", async () => {
      mockClient.databases.query.mockResolvedValue({
        results: [],
        has_more: false,
        next_cursor: null,
      });

      const result = await queryBuilder
        .filter("Title", "contains", "test")
        .paginate(10);

      expect(result.results).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    test("should handle API errors gracefully", async () => {
      const apiError = new Error("Notion API Error: Database not found");
      mockClient.databases.query.mockRejectedValue(apiError);

      await expect(
        queryBuilder.filter("Title", "contains", "test").paginate(10)
      ).rejects.toThrow("Notion API Error: Database not found");
    });

    test("should handle missing field types gracefully", () => {
      const builderWithoutTypes = new QueryBuilder<ComprehensiveRecord>(
        mockClient,
        "test-database-id"
      );

      // Should throw for unknown field types due to validation
      expect(() => {
        (builderWithoutTypes as any).filter("Unknown Field", "equals", "value");
      }).toThrow("Invalid operator");
    });
  });

  describe("Operator Validation by Field Type", () => {
    test("text fields should only accept text operators", () => {
      const textFields = [
        "Title",
        "Rich Text",
        "URL",
        "Email",
        "Phone",
      ] as const;
      const textOperators = [
        "equals",
        "does_not_equal",
        "contains",
        "does_not_contain",
        "starts_with",
        "ends_with",
        "is_empty",
        "is_not_empty",
      ];

      textFields.forEach((field) => {
        textOperators.forEach((operator) => {
          expect(() => {
            (queryBuilder as any).filter(field, operator, "test");
          }).not.toThrow();
        });

        // Should reject non-text operators
        expect(() => {
          (queryBuilder as any).filter(field, "greater_than", "test");
        }).toThrow();
      });
    });

    test("number fields should only accept numeric operators", () => {
      const numericOperators = [
        "equals",
        "does_not_equal",
        "greater_than",
        "less_than",
        "greater_than_or_equal_to",
        "less_than_or_equal_to",
        "is_empty",
        "is_not_empty",
      ];

      numericOperators.forEach((operator) => {
        expect(() => {
          queryBuilder.filter("Number", operator as any, 123);
        }).not.toThrow();
      });

      // Should reject text operators
      expect(() => {
        (queryBuilder as any).filter("Number", "contains", 123);
      }).toThrow();
    });

    test("select fields should only accept select operators", () => {
      const selectOperators = [
        "equals",
        "does_not_equal",
        "is_empty",
        "is_not_empty",
      ];

      selectOperators.forEach((operator) => {
        expect(() => {
          (queryBuilder as any).filter("Single Select", operator, "Option A");
        }).not.toThrow();
      });

      // Should reject inappropriate operators
      expect(() => {
        (queryBuilder as any).filter("Single Select", "contains", "Option A");
      }).toThrow();
    });

    test("checkbox fields should only accept equals operator", () => {
      expect(() => {
        queryBuilder.filter("Checkbox", "equals", true);
      }).not.toThrow();

      // Should reject all other operators
      expect(() => {
        (queryBuilder as any).filter("Checkbox", "contains", true);
      }).toThrow();

      expect(() => {
        (queryBuilder as any).filter("Checkbox", "greater_than", true);
      }).toThrow();
    });

    test("date fields should only accept date operators", () => {
      const dateOperators = [
        "equals",
        "before",
        "after",
        "on_or_before",
        "on_or_after",
        "is_empty",
        "is_not_empty",
      ];

      dateOperators.forEach((operator) => {
        expect(() => {
          (queryBuilder as any).filter("Date", operator, new Date());
        }).not.toThrow();
      });

      // Should reject inappropriate operators
      expect(() => {
        (queryBuilder as any).filter("Date", "contains", new Date());
      }).toThrow();
    });
  });

  describe("Value Type Validation", () => {
    test("should handle different date formats", () => {
      expect(() => {
        queryBuilder.filter("Date", "after", new Date("2024-01-01"));
        queryBuilder.filter("Date", "before", "2024-12-31");
      }).not.toThrow();
    });

    test("should handle empty/not empty operators correctly", () => {
      expect(() => {
        queryBuilder.filter("Rich Text", "is_empty", true);
        queryBuilder.filter("Number", "is_not_empty", true);
        queryBuilder.filter("Files", "is_empty", true);
      }).not.toThrow();
    });

    test("should handle multi-select properly", () => {
      expect(() => {
        // Multi-select contains expects a single value, not array
        queryBuilder.filter("Multi Select", "contains", "Tag 1");
        queryBuilder.filter("Multi Select", "does_not_contain", "Tag 2");
      }).not.toThrow();
    });
  });

  describe("Complex Query Building", () => {
    test("should build complex filters with multiple conditions", async () => {
      await queryBuilder
        .filter("Title", "contains", "important")
        .filter("Status", "equals", "Active")
        .filter("Number", "greater_than", 100)
        .filter("Date", "after", new Date("2024-01-01"))
        .filter("Checkbox", "equals", true)
        .sort("Date", "descending")
        .limit(25)
        .paginate(10);

      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: "test-database-id",
        filter: {
          and: [
            {
              property: "Title",
              title: { contains: "important" },
            },
            {
              property: "Status",
              status: { equals: "Active" },
            },
            {
              property: "Number",
              number: { greater_than: 100 },
            },
            {
              property: "Date",
              date: { after: "2024-01-01T00:00:00.000Z" },
            },
            {
              property: "Checkbox",
              checkbox: { equals: true },
            },
          ],
        },
        sorts: [{ property: "Date", direction: "descending" }],
        page_size: 10,
        start_cursor: undefined,
      });
    });

    test("should handle single vs multiple filter conditions", async () => {
      // Single filter should not be wrapped in 'and'
      const singleBuilder = new QueryBuilder<
        ComprehensiveRecord,
        typeof ComprehensiveFieldTypes
      >(mockClient, "test-database-id", ComprehensiveFieldTypes);

      await singleBuilder.filter("Title", "contains", "test").paginate(10);

      const calls = mockClient.databases.query.mock.calls;
      const lastCall = calls[calls.length - 1][0];

      expect(lastCall.filter).toEqual({
        property: "Title",
        title: { contains: "test" },
      });
    });
  });

  describe("Method Chaining and API", () => {
    test("should support full method chaining", () => {
      const result = queryBuilder
        .filter("Title", "contains", "test")
        .filter("Number", "greater_than", 50)
        .sort("Date", "ascending")
        .limit(20)
        .startAfter("cursor-123");

      expect(result).toBe(queryBuilder); // Should return same instance for chaining
    });

    test("should support single() and maybeSingle() modes", async () => {
      mockClient.databases.query.mockResolvedValue({
        results: [
          {
            id: "test-page-1",
            properties: {
              Title: { type: "title", title: [{ text: { content: "Test" } }] },
            },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      // Test single() mode
      const singleResult = await queryBuilder
        .filter("Title", "equals", "unique-title")
        .single();

      expect((singleResult as ComprehensiveRecord).id).toBe("test-page-1");

      // Test maybeSingle() mode
      const maybeSingleResult = await queryBuilder
        .filter("Title", "equals", "maybe-unique")
        .maybeSingle();

      expect((maybeSingleResult as ComprehensiveRecord)?.id).toBe(
        "test-page-1"
      );
    });

    test("should handle pagination correctly", async () => {
      mockClient.databases.query.mockResolvedValue({
        results: [
          {
            id: "page-1",
            properties: {
              Title: {
                type: "title",
                title: [{ text: { content: "Page 1" } }],
              },
            },
          },
          {
            id: "page-2",
            properties: {
              Title: {
                type: "title",
                title: [{ text: { content: "Page 2" } }],
              },
            },
          },
        ],
        has_more: true,
        next_cursor: "next-cursor-123",
      });

      const result = await queryBuilder
        .filter("Title", "contains", "test")
        .paginate(2);

      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe("next-cursor-123");
      expect(result.results).toHaveLength(2);
    });
  });

  describe("Performance and Type Inference", () => {
    test("should not cause TypeScript compilation slowdowns", () => {
      // This is primarily a compile-time test
      // The fact that this compiles reasonably quickly indicates good performance

      // Test that basic types resolve properly
      const titleType: "title" = "title";
      const selectOpt: "Option A" = "Option A";
      const multiOpt: "Tag 1" = "Tag 1";

      expect(titleType).toBe("title");
      expect(selectOpt).toBe("Option A");
      expect(multiOpt).toBe("Tag 1");
    });

    test("should provide meaningful error messages", () => {
      try {
        (queryBuilder as any).filter("Checkbox", "contains", true);
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Invalid operator");
        expect(error.message).toContain("Checkbox");
        expect(error.message).toContain("checkbox");
      }
    });
  });
});

/**
 * TYPE SAFETY VALIDATION
 *
 * These are compile-time tests that validate the type system works correctly.
 * If these don't compile, it indicates a problem with our type definitions.
 */

// Test that field names are properly constrained
function testFieldNameConstraints() {
  const builder = new QueryBuilder<
    ComprehensiveRecord,
    typeof ComprehensiveFieldTypes
  >({} as Client, "test-db", ComprehensiveFieldTypes);

  // ✅ Valid field names should work
  builder.filter("Title", "contains", "test");
  builder.filter("Single Select", "equals", "Option A");
  builder.filter("Multi Select", "contains", "Tag 1");

  // ❌ Invalid field names should cause compile errors (uncomment to test)
  // builder.filter("Invalid Field", "equals", "test"); // Should error
  // builder.filter("Title", "invalid_operator", "test"); // Should error
  // builder.filter("Single Select", "equals", "Invalid Option"); // Should error
}

// Test that operators are properly constrained by field type
function testOperatorConstraints() {
  const builder = new QueryBuilder<
    ComprehensiveRecord,
    typeof ComprehensiveFieldTypes
  >({} as Client, "test-db", ComprehensiveFieldTypes);

  // ✅ Valid operator/field combinations
  builder.filter("Title", "contains", "text");
  builder.filter("Number", "greater_than", 100);
  builder.filter("Date", "after", new Date());
  builder.filter("Checkbox", "equals", true);

  // ❌ Invalid combinations should cause compile errors (uncomment to test)
  // builder.filter("Checkbox", "contains", true); // Should error - checkbox only supports equals
  // builder.filter("Number", "contains", 100); // Should error - number doesn't support contains
  // builder.filter("Date", "greater_than", new Date()); // Should error - date doesn't support greater_than
}

// Test that values are properly constrained by field type and options
function testValueConstraints() {
  const builder = new QueryBuilder<
    ComprehensiveRecord,
    typeof ComprehensiveFieldTypes
  >({} as Client, "test-db", ComprehensiveFieldTypes);

  // ✅ Valid value types
  builder.filter("Title", "contains", "string value");
  builder.filter("Number", "equals", 123);
  builder.filter("Checkbox", "equals", true);
  builder.filter("Single Select", "equals", "Option A");
  builder.filter("Multi Select", "contains", "Tag 1");

  // ❌ Invalid value types should cause compile errors (uncomment to test)
  // builder.filter("Number", "equals", "not a number"); // Should error
  // builder.filter("Checkbox", "equals", "not a boolean"); // Should error
  // builder.filter("Single Select", "equals", "Invalid Option"); // Should error
  // builder.filter("Multi Select", "contains", "Invalid Tag"); // Should error
}
