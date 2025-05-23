/**
 * Enhanced Sort Implementation Tests
 *
 * Tests for the improved sort method with comprehensive documentation
 * and runtime validation following the filter implementation pattern.
 */

import { Client } from "@notionhq/client";
import { QueryBuilder, DatabaseFieldMetadata } from "../query-builder";

// Test database metadata for sort testing
const SortTestFieldTypes = {
  Title: { type: "title" },
  Priority: {
    type: "select",
    options: ["High", "Medium", "Low"] as const,
  },
  "Created Date": { type: "date" },
  "Estimated Cost": { type: "number" },
  "Is Active": { type: "checkbox" },
  Team: { type: "rich_text" },
  Status: { type: "status" },
  Tags: {
    type: "multi_select",
    options: ["urgent", "review", "approved"] as const,
  },
  Owner: { type: "people" },
  "Related Items": { type: "relation" },
  Score: { type: "formula" },
  Summary: { type: "rollup" },
  "External Link": { type: "url" },
  "Contact Email": { type: "email" },
} as const satisfies DatabaseFieldMetadata;

type SortTestRecord = {
  id: string;
  Title: string;
  Priority: "High" | "Medium" | "Low";
  "Created Date": Date;
  "Estimated Cost": number;
  "Is Active": boolean;
  Team: string;
  Status: any;
  Tags: Array<"urgent" | "review" | "approved">;
  Owner: string[];
  "Related Items": string[];
  Score: any;
  Summary: any;
  "External Link": string;
  "Contact Email": string;
};

describe("Enhanced Sort Implementation", () => {
  let mockClient: any;
  let queryBuilder: QueryBuilder<SortTestRecord, typeof SortTestFieldTypes>;

  beforeEach(() => {
    mockClient = {
      databases: {
        query: jest.fn().mockResolvedValue({
          results: [],
          has_more: false,
          next_cursor: null,
        }),
      },
    };

    queryBuilder = new QueryBuilder<SortTestRecord, typeof SortTestFieldTypes>(
      mockClient,
      "test-database-id",
      SortTestFieldTypes
    );
  });

  describe("Sort Method Documentation & Type Safety", () => {
    test("should accept all field types for sorting", () => {
      // All these should work without errors
      expect(() => {
        queryBuilder
          .sort("Title", "ascending") // title field
          .sort("Priority", "descending") // select field
          .sort("Created Date", "ascending") // date field
          .sort("Estimated Cost", "descending") // number field
          .sort("Is Active", "ascending") // checkbox field
          .sort("Team", "descending") // rich_text field
          .sort("Status", "ascending") // status field
          .sort("Tags", "descending") // multi_select field
          .sort("Owner", "ascending") // people field
          .sort("Related Items", "descending") // relation field
          .sort("Score", "ascending") // formula field
          .sort("Summary", "descending") // rollup field
          .sort("External Link", "ascending") // url field
          .sort("Contact Email", "descending"); // email field
      }).not.toThrow();
    });

    test("should provide IntelliSense for field names", () => {
      // This is primarily a compile-time test
      // The fact that this compiles means field name suggestions work
      const result = queryBuilder.sort("Created Date", "descending");
      expect(result).toBe(queryBuilder);
    });

    test("should constrain direction parameter", () => {
      // Valid directions
      expect(() => {
        queryBuilder.sort("Title", "ascending");
        queryBuilder.sort("Title", "descending");
        queryBuilder.sort("Title"); // Default to ascending
      }).not.toThrow();
    });

    test("should return QueryBuilder for method chaining", () => {
      const result = queryBuilder.sort("Title", "ascending");
      expect(result).toBe(queryBuilder);
      expect(result.sort).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(result.limit).toBeDefined();
    });
  });

  describe("Runtime Validation", () => {
    test("should throw error for invalid field name", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation for invalid field
        queryBuilder.sort("InvalidField", "ascending");
      }).toThrow(
        'Invalid sort property "InvalidField". Property not found in database schema.'
      );
    });

    test("should provide helpful error message with available fields", () => {
      try {
        // @ts-expect-error - Testing runtime validation
        queryBuilder.sort("NonExistentField", "ascending");
      } catch (error) {
        expect((error as Error).message).toContain("Available fields:");
        expect((error as Error).message).toContain("Title");
        expect((error as Error).message).toContain("Priority");
        expect((error as Error).message).toContain("Created Date");
      }
    });

    test("should throw error for invalid sort direction", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation for invalid direction
        queryBuilder.sort("Title", "invalid");
      }).toThrow(
        'Invalid sort direction "invalid". Must be "ascending" or "descending".'
      );
    });

    test("should accept valid field names and directions", () => {
      expect(() => {
        queryBuilder.sort("Title", "ascending");
        queryBuilder.sort("Priority", "descending");
      }).not.toThrow();
    });
  });

  describe("Multiple Sort Support", () => {
    test("should support nested sorting (multiple sorts)", () => {
      expect(() => {
        queryBuilder
          .sort("Priority", "descending") // Primary sort
          .sort("Created Date", "ascending") // Secondary sort
          .sort("Title", "ascending"); // Tertiary sort
      }).not.toThrow();
    });

    test("should build correct sort options for Notion API", async () => {
      await queryBuilder
        .sort("Priority", "descending")
        .sort("Estimated Cost", "ascending")
        .sort("Created Date", "descending")
        .paginate(10);

      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: "test-database-id",
        filter: undefined,
        sorts: [
          { property: "Priority", direction: "descending" },
          { property: "Estimated Cost", direction: "ascending" },
          { property: "Created Date", direction: "descending" },
        ],
        page_size: 10,
        start_cursor: undefined,
      });
    });

    test("should handle single sort without array nesting issues", async () => {
      await queryBuilder.sort("Title", "ascending").paginate(5);

      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: "test-database-id",
        filter: undefined,
        sorts: [{ property: "Title", direction: "ascending" }],
        page_size: 5,
        start_cursor: undefined,
      });
    });
  });

  describe("Sort with Filter Integration", () => {
    test("should work correctly when combined with filters", async () => {
      await queryBuilder
        .filter("Is Active", "equals", true)
        .filter("Priority", "equals", "High")
        .sort("Created Date", "descending")
        .sort("Title", "ascending")
        .limit(20);

      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: "test-database-id",
        filter: {
          and: [
            {
              property: "Is Active",
              checkbox: { equals: true },
            },
            {
              property: "Priority",
              select: { equals: "High" },
            },
          ],
        },
        sorts: [
          { property: "Created Date", direction: "descending" },
          { property: "Title", direction: "ascending" },
        ],
        page_size: 20,
        start_cursor: undefined,
      });
    });
  });

  describe("Real-world Sort Scenarios", () => {
    test("should handle priority-based sorting", () => {
      expect(() => {
        queryBuilder
          .filter("Is Active", "equals", true)
          .sort("Priority", "descending") // High priority first
          .sort("Created Date", "ascending") // Oldest first within same priority
          .limit(50);
      }).not.toThrow();
    });

    test("should handle cost-based sorting", () => {
      expect(() => {
        queryBuilder
          .filter("Estimated Cost", "greater_than", 0)
          .sort("Estimated Cost", "descending") // Most expensive first
          .sort("Title", "ascending") // Alphabetical for same cost
          .limit(25);
      }).not.toThrow();
    });

    test("should handle date-based sorting", () => {
      expect(() => {
        queryBuilder
          .filter("Created Date", "after", new Date("2024-01-01"))
          .sort("Created Date", "descending") // Newest first
          .limit(100);
      }).not.toThrow();
    });

    test("should handle text field sorting", () => {
      expect(() => {
        queryBuilder
          .filter("Team", "is_not_empty", "")
          .sort("Team", "ascending") // Team alphabetically
          .sort("Title", "ascending") // Title alphabetically within team
          .limit(75);
      }).not.toThrow();
    });
  });

  describe("Default Parameter Behavior", () => {
    test("should default to ascending direction when not specified", async () => {
      await queryBuilder
        .sort("Title") // No direction specified
        .paginate(10);

      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: "test-database-id",
        filter: undefined,
        sorts: [{ property: "Title", direction: "ascending" }],
        page_size: 10,
        start_cursor: undefined,
      });
    });
  });
});

/**
 * DEMONSTRATION: Real-world Sort Usage Examples
 *
 * These examples show how the enhanced sort method would be used
 * in practical scenarios with proper IntelliSense support.
 */
export function demonstrateEnhancedSortUsage() {
  const mockClient = {} as Client;
  const query = new QueryBuilder<SortTestRecord, typeof SortTestFieldTypes>(
    mockClient,
    "database-id",
    SortTestFieldTypes
  );

  // Example 1: Task management - priority-based sorting
  const highPriorityTasks = query
    .filter("Is Active", "equals", true)
    .sort("Priority", "descending") // High → Medium → Low
    .sort("Created Date", "ascending") // Oldest first within priority
    .limit(20);

  // Example 2: Cost analysis - expense tracking
  const expensiveItems = query
    .filter("Estimated Cost", "greater_than", 100)
    .sort("Estimated Cost", "descending") // Most expensive first
    .sort("Team", "ascending") // Team grouping for same cost
    .limit(50);

  // Example 3: Recent activity - timeline view
  const recentActivity = query
    .filter("Created Date", "after", new Date("2024-01-01"))
    .sort("Created Date", "descending") // Newest first
    .sort("Priority", "descending") // High priority within same date
    .limit(100);

  // Example 4: Team management - organizational view
  const teamOverview = query
    .filter("Team", "is_not_empty", "")
    .sort("Team", "ascending") // Alphabetical team order
    .sort("Priority", "descending") // High priority within team
    .sort("Title", "ascending") // Alphabetical within team/priority
    .limit(200);

  return {
    highPriorityTasks,
    expensiveItems,
    recentActivity,
    teamOverview,
  };
}
