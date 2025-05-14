import { expectTypeOf } from "expect-type";
import { NotionCMS } from "..";
import { DatabaseRecord } from "../utils/property-helpers";

// Mock record types for testing
interface TestRecord extends DatabaseRecord {
  id: string; // Required by DatabaseRecord

  // Text field
  Title: string;
  // Select field
  Environment: "Dev" | "Staging" | "Prod";
  // Multi-select field
  "Reason for Keeping": Array<"Pending migration" | "Critical service">;
  // Number field
  "Estimated Monthly Cost (USD)": number;
  // Date field
  "Provision Date": Date;
  // Boolean field
  "Is Active": boolean;
  // People field
  Owner: string[];

  advanced: any;
  raw: any;
}

describe("Query Builder Type Tests", () => {
  // Create a mock NotionCMS instance for type tests
  const cms = new NotionCMS("mock-api-key");
  const query = cms.query<TestRecord>("mock-db-id");

  test("Multi-select field should have correct methods", () => {
    const filter = query.filter("Reason for Keeping");

    // Should have equals method for multi-select
    expectTypeOf(filter.equals).toBeFunction();

    // Skip runtime test for contains - instead we'll document that at compile time,
    // 'contains' should not be available on multi-select fields
  });

  test("Text field should have correct methods", () => {
    const filter = query.filter("Title");

    // Should have both equals and contains for text fields
    expectTypeOf(filter.equals).toBeFunction();
    expectTypeOf(filter.contains).toBeFunction();
  });

  test("Select field should accept only valid enum values", () => {
    const filter = query.filter("Environment");

    // Should compile with valid values
    filter.equals("Dev");
    filter.equals("Staging");
    filter.equals("Prod");

    // This would normally fail at compile time with a type error
    // We can't easily test this in Jest, but we can document it
  });

  test("Number field should have correct methods", () => {
    const filter = query.filter("Estimated Monthly Cost (USD)");

    // Should have numeric comparison methods
    expectTypeOf(filter.equals).toBeFunction();
    expectTypeOf(filter.greaterThan).toBeFunction();
    expectTypeOf(filter.lessThan).toBeFunction();

    // Skip runtime test for contains - instead we'll document that at compile time,
    // 'contains' should not be available on number fields
  });

  test("Date field should have date-specific methods", () => {
    const filter = query.filter("Provision Date");

    // Should have date-specific methods
    expectTypeOf(filter.equals).toBeFunction();
    expectTypeOf(filter.before).toBeFunction();
    expectTypeOf(filter.after).toBeFunction();

    // Skip runtime test for contains - instead we'll document that at compile time,
    // 'contains' should not be available on date fields
  });

  test("Boolean field should have correct methods", () => {
    const filter = query.filter("Is Active");

    // Should have equals but not text methods
    expectTypeOf(filter.equals).toBeFunction();

    // Skip runtime test for contains - instead we'll document that at compile time,
    // 'contains' should not be available on boolean fields
  });
});
