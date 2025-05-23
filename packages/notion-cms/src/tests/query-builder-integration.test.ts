/**
 * Integration tests for the new QueryBuilder filter method
 * Tests the actual filter implementation and IntelliSense behavior
 */

import { Client } from "@notionhq/client";
import { QueryBuilder, DatabaseFieldMetadata } from "../query-builder";

// Test database metadata (matching the Resource Tracker structure)
const ResourceTrackerFieldTypes = {
  "Last Review Date": { type: "date" },
  "Estimated Monthly Cost": { type: "number" },
  "Tag Compliance": { type: "checkbox" },
  Owner: { type: "people" },
  "Last Used Date": { type: "date" },
  "Service Name": {
    type: "multi_select",
    options: [
      "notifications",
      "analytics",
      "payment-gateway",
      "user-service",
      "auth-service",
    ] as const,
  },
  "Linked Project / Jira Ticket": { type: "url" },
  "Can Be Deprovisioned": { type: "checkbox" },
  Environment: {
    type: "select",
    options: ["Dev", "Staging", "Prod"] as const,
  },
  "Auto Shutdown Configured": { type: "checkbox" },
  "Instance Size / Tier": { type: "rich_text" },
  "Estimated Monthly Cost (USD)": { type: "number" },
  "Provision Date": { type: "date" },
  "Resource Type": {
    type: "select",
    options: [
      "EC2",
      "S3",
      "Lambda",
      "RDS",
      "ECS",
      "DynamoDB",
      "ElastiCache",
      "SNS",
      "SQS",
      "EKS",
    ] as const,
  },
  Region: {
    type: "select",
    options: [
      "us-east-1",
      "us-east-2",
      "us-west-1",
      "us-west-2",
      "eu-west-1",
      "eu-central-1",
      "ap-southeast-1",
      "ap-southeast-2",
    ] as const,
  },
  Team: { type: "rich_text" },
  Notes: { type: "rich_text" },
  "Is Active": { type: "checkbox" },
  Title: { type: "title" },
} as const satisfies DatabaseFieldMetadata;

type ResourceTrackerRecord = {
  id: string;
  "Last Review Date": Date;
  "Estimated Monthly Cost": number;
  "Tag Compliance": boolean;
  Owner: string[];
  "Last Used Date": Date;
  "Service Name": Array<
    | "notifications"
    | "analytics"
    | "payment-gateway"
    | "user-service"
    | "auth-service"
  >;
  "Linked Project / Jira Ticket": string;
  "Can Be Deprovisioned": boolean;
  Environment: "Dev" | "Staging" | "Prod";
  "Auto Shutdown Configured": boolean;
  "Instance Size / Tier": string;
  "Estimated Monthly Cost (USD)": number;
  "Provision Date": Date;
  "Resource Type":
    | "EC2"
    | "S3"
    | "Lambda"
    | "RDS"
    | "ECS"
    | "DynamoDB"
    | "ElastiCache"
    | "SNS"
    | "SQS"
    | "EKS";
  Region:
    | "us-east-1"
    | "us-east-2"
    | "us-west-1"
    | "us-west-2"
    | "eu-west-1"
    | "eu-central-1"
    | "ap-southeast-1"
    | "ap-southeast-2";
  Team: string;
  Notes: string;
  "Is Active": boolean;
  Title: string;
};

describe("QueryBuilder Integration Tests", () => {
  let mockClient: any;
  let queryBuilder: QueryBuilder<
    ResourceTrackerRecord,
    typeof ResourceTrackerFieldTypes
  >;

  beforeEach(() => {
    // Create a mock client with proper Jest mocking
    mockClient = {
      databases: {
        query: jest.fn().mockResolvedValue({
          results: [],
          has_more: false,
          next_cursor: null,
        }),
      },
    };

    // Create QueryBuilder instance
    queryBuilder = new QueryBuilder<
      ResourceTrackerRecord,
      typeof ResourceTrackerFieldTypes
    >(mockClient, "test-database-id", ResourceTrackerFieldTypes);
  });

  describe("Filter Method Implementation", () => {
    test("should exist and be callable", () => {
      expect(typeof queryBuilder.filter).toBe("function");
    });

    test("should accept valid field names", () => {
      expect(() => {
        queryBuilder.filter("Provision Date", "after", new Date("2024-01-01"));
      }).not.toThrow();
    });

    test("should validate operators for field types", () => {
      // Valid combinations
      expect(() => {
        queryBuilder.filter("Provision Date", "after", new Date("2024-01-01"));
      }).not.toThrow();

      expect(() => {
        queryBuilder.filter("Estimated Monthly Cost", "greater_than", 100);
      }).not.toThrow();

      expect(() => {
        queryBuilder.filter("Is Active", "equals", true);
      }).not.toThrow();

      expect(() => {
        queryBuilder.filter("Environment", "equals", "Prod");
      }).not.toThrow();

      // Invalid operator for field type should throw at runtime
      expect(() => {
        queryBuilder.filter("Is Active", "contains" as any, true);
      }).toThrow("Invalid operator");
    });

    test("should build filters correctly", async () => {
      await queryBuilder
        .filter("Provision Date", "after", new Date("2024-01-01"))
        .filter("Is Active", "equals", true)
        .filter("Environment", "equals", "Prod")
        .paginate(10);

      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: "test-database-id",
        filter: {
          and: [
            {
              property: "Provision Date",
              date: {
                after: "2024-01-01T00:00:00.000Z",
              },
            },
            {
              property: "Is Active",
              checkbox: {
                equals: true,
              },
            },
            {
              property: "Environment",
              select: {
                equals: "Prod",
              },
            },
          ],
        },
        sorts: undefined,
        page_size: 10,
        start_cursor: undefined,
      });
    });

    test("should handle single filter without wrapping in 'and'", async () => {
      await queryBuilder.filter("Is Active", "equals", true).paginate(10);

      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: "test-database-id",
        filter: {
          property: "Is Active",
          checkbox: {
            equals: true,
          },
        },
        sorts: undefined,
        page_size: 10,
        start_cursor: undefined,
      });
    });

    test("should handle date conversion", () => {
      const testDate = new Date("2024-01-01T10:30:00.000Z");

      queryBuilder.filter("Provision Date", "after", testDate);

      // Access private method for testing
      const conditions = (queryBuilder as any).filterConditions;
      expect(conditions[0].value).toBe("2024-01-01T10:30:00.000Z");
    });

    test("should handle multi-select contains", () => {
      queryBuilder.filter("Service Name", "contains", "analytics");

      const conditions = (queryBuilder as any).filterConditions;
      expect(conditions[0].value).toBe("analytics");
    });

    test("should handle empty/not empty operators", () => {
      queryBuilder.filter("Notes", "is_empty", "" as any);

      const conditions = (queryBuilder as any).filterConditions;
      expect(conditions[0].value).toBe(true);
    });
  });

  describe("Method Chaining", () => {
    test("should return QueryBuilder for chaining", () => {
      const result = queryBuilder.filter("Is Active", "equals", true);
      expect(result).toBe(queryBuilder);
    });

    test("should support complex chaining", () => {
      expect(() => {
        queryBuilder
          .filter("Environment", "equals", "Prod")
          .filter("Is Active", "equals", true)
          .filter("Estimated Monthly Cost", "greater_than", 50)
          .sort("Provision Date", "descending")
          .limit(25);
      }).not.toThrow();
    });
  });

  describe("Sorting", () => {
    test("should build sort options correctly", async () => {
      await queryBuilder.sort("Provision Date", "descending").paginate(10);

      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: "test-database-id",
        filter: undefined,
        sorts: [
          {
            property: "Provision Date",
            direction: "descending",
          },
        ],
        page_size: 10,
        start_cursor: undefined,
      });
    });
  });
});

/**
 * TYPE INTELLISENSE DEMONSTRATION
 *
 * This section demonstrates the IntelliSense behavior that should now work.
 * When you type these examples in your IDE, you should see:
 *
 * 1. Field name suggestions
 * 2. Operator suggestions based on field type
 * 3. Value validation based on field type
 */
export function demonstrateIntelliSense() {
  const mockClient = {} as Client;
  const query = new QueryBuilder<
    ResourceTrackerRecord,
    typeof ResourceTrackerFieldTypes
  >(mockClient, "database-id", ResourceTrackerFieldTypes);

  // When typing this, you should see IntelliSense suggestions:
  return query
    .filter("Provision Date", "after", new Date("2024-01-01")) // ✅ Date field → date operators → Date/string value
    .filter("Environment", "equals", "Prod") // ✅ Select field → select operators → option values
    .filter("Is Active", "equals", true) // ✅ Checkbox field → equals only → boolean value
    .filter("Estimated Monthly Cost", "greater_than", 100) // ✅ Number field → numeric operators → number value
    .filter("Service Name", "contains", "analytics") // ✅ Multi-select → multi-select operators → option values
    .sort("Provision Date", "descending") // ✅ Field names → sort direction
    .limit(10);
}
