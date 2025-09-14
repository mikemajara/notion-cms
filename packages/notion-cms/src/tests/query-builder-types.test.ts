/**
 * Type tests for the new QueryBuilder type system
 * These tests validate compile-time type safety and IntelliSense behavior
 */

import {
  DatabaseFieldMetadata,
  OperatorsFor,
  ValueTypeFor,
  FieldTypeFor,
  SelectOptionsFor,
  OperatorMap,
  OPERATOR_MAP
} from "../query-builder"

// ============================================================================
// TEST DATABASE METADATA (simulating generated types)
// ============================================================================

const TestDatabaseFieldTypes = {
  Title: { type: "title" },
  Description: { type: "rich_text" },
  Price: { type: "number" },
  Category: {
    type: "select",
    options: ["Electronics", "Books", "Clothing"] as const
  },
  Tags: { type: "multi_select", options: ["New", "Sale", "Featured"] as const },
  "Is Active": { type: "checkbox" },
  "Created Date": { type: "date" },
  Owner: { type: "people" }
} as const satisfies DatabaseFieldMetadata

type TestFieldTypes = typeof TestDatabaseFieldTypes

// ============================================================================
// TYPE VALIDATION TESTS
// ============================================================================

// Test FieldTypeFor extraction
type TitleFieldType = FieldTypeFor<"Title", TestFieldTypes> // Should be "title"
type PriceFieldType = FieldTypeFor<"Price", TestFieldTypes> // Should be "number"
type CategoryFieldType = FieldTypeFor<"Category", TestFieldTypes> // Should be "select"

// Test OperatorsFor extraction
type TitleOperators = OperatorsFor<"Title", TestFieldTypes>
// Should be: "equals" | "does_not_equal" | "contains" | "does_not_contain" | "starts_with" | "ends_with" | "is_empty" | "is_not_empty"

type PriceOperators = OperatorsFor<"Price", TestFieldTypes>
// Should be: "equals" | "does_not_equal" | "greater_than" | "less_than" | "greater_than_or_equal_to" | "less_than_or_equal_to" | "is_empty" | "is_not_empty"

type CheckboxOperators = OperatorsFor<"Is Active", TestFieldTypes>
// Should be: "equals"

// Test SelectOptionsFor extraction
type CategoryOptions = SelectOptionsFor<"Category", TestFieldTypes>
// Should be: "Electronics" | "Books" | "Clothing"

// Test ValueTypeFor extraction
type TitleValue = ValueTypeFor<"Title", TestFieldTypes> // Should be string
type PriceValue = ValueTypeFor<"Price", TestFieldTypes> // Should be number
type CategoryValue = ValueTypeFor<"Category", TestFieldTypes> // Should be "Electronics" | "Books" | "Clothing"
type TagsValue = ValueTypeFor<"Tags", TestFieldTypes> // Should be ("New" | "Sale" | "Featured")[]
type CheckboxValue = ValueTypeFor<"Is Active", TestFieldTypes> // Should be boolean
type DateValue = ValueTypeFor<"Created Date", TestFieldTypes> // Should be Date | string

// ============================================================================
// COMPILE-TIME TYPE ASSERTIONS
// ============================================================================

// These should compile without errors if types are working correctly
const validTitleOperator: TitleOperators = "contains" // ✅
const validPriceOperator: PriceOperators = "greater_than" // ✅
const validCheckboxOperator: CheckboxOperators = "equals" // ✅

const validCategoryValue: CategoryValue = "Electronics" // ✅
const validCheckboxValue: CheckboxValue = true // ✅

// These should cause compile-time errors (commented out to prevent build failures)
// const invalidTitleOperator: TitleOperators = "greater_than"; // ❌ Should error
// const invalidPriceOperator: PriceOperators = "contains"; // ❌ Should error
// const invalidCheckboxOperator: CheckboxOperators = "contains"; // ❌ Should error
// const invalidCategoryValue: CategoryValue = "InvalidCategory"; // ❌ Should error

// ============================================================================
// RUNTIME VALIDATION TESTS
// ============================================================================

describe("QueryBuilder Type System", () => {
  describe("Operator Map", () => {
    test("should have all field types covered", () => {
      const fieldTypes: (keyof OperatorMap)[] = [
        "title",
        "rich_text",
        "number",
        "select",
        "multi_select",
        "date",
        "people",
        "files",
        "checkbox",
        "url",
        "email",
        "phone_number",
        "formula",
        "relation",
        "rollup",
        "created_time",
        "created_by",
        "last_edited_time",
        "last_edited_by",
        "status",
        "unique_id",
        "unknown"
      ]

      fieldTypes.forEach((fieldType) => {
        expect(OPERATOR_MAP[fieldType]).toBeDefined()
        expect(Array.isArray(OPERATOR_MAP[fieldType])).toBe(true)
        expect(OPERATOR_MAP[fieldType].length).toBeGreaterThan(0)
      })
    })

    test("text fields should have text-specific operators", () => {
      const textFields = [
        "title",
        "rich_text",
        "url",
        "email",
        "phone_number"
      ] as const

      textFields.forEach((field) => {
        const operators = OPERATOR_MAP[field]
        expect(operators).toContain("contains")
        expect(operators).toContain("starts_with")
        expect(operators).toContain("ends_with")
      })
    })

    test("number fields should have numeric operators", () => {
      const operators = OPERATOR_MAP.number
      expect(operators).toContain("greater_than")
      expect(operators).toContain("less_than")
      expect(operators).toContain("greater_than_or_equal_to")
      expect(operators).toContain("less_than_or_equal_to")
    })

    test("date fields should have date-specific operators", () => {
      const operators = OPERATOR_MAP.date
      expect(operators).toContain("before")
      expect(operators).toContain("after")
      expect(operators).toContain("on_or_before")
      expect(operators).toContain("on_or_after")
    })

    test("checkbox fields should only have equals operator", () => {
      const operators = OPERATOR_MAP.checkbox
      expect(operators).toEqual(["equals"])
    })

    test("select fields should have selection-specific operators", () => {
      const operators = OPERATOR_MAP.select
      expect(operators).toContain("equals")
      expect(operators).toContain("does_not_equal")
      expect(operators).not.toContain("contains") // Should not have text operators
    })

    test("multi_select fields should have multi-selection operators", () => {
      const operators = OPERATOR_MAP.multi_select
      expect(operators).toContain("contains")
      expect(operators).toContain("does_not_contain")
      expect(operators).not.toContain("greater_than") // Should not have numeric operators
    })
  })

  describe("Type Constraints", () => {
    test("should enforce readonly arrays for select options", () => {
      // This is a compile-time test - the fact that this compiles means it works
      const metadata: DatabaseFieldMetadata = {
        Status: { type: "select", options: ["Active", "Inactive"] as const }
      }

      expect(metadata["Status"].type).toBe("select")
    })
  })
})

// ============================================================================
// EXPORT FOR USE IN OTHER TESTS
// ============================================================================

export { TestDatabaseFieldTypes }
export type { TestFieldTypes }

// ============================================================================
// OPERATOR VALIDATION TESTS
// ============================================================================

/**
 * Test that operators are correctly extracted based on field type
 */
describe("Operator Type Extraction", () => {
  test("should extract correct operators for different field types", () => {
    // Date field operators
    type DateOps = OperatorsFor<"Created Date", typeof TestDatabaseFieldTypes>
    const dateOp: DateOps = "after" // ✅
    const dateOp2: DateOps = "before" // ✅
    const dateOp3: DateOps = "equals" // ✅
    // const invalidDateOp: DateOps = "contains"; // ❌ Should be TypeScript error

    // Number field operators
    type NumberOps = OperatorsFor<"Price", typeof TestDatabaseFieldTypes>
    const numOp: NumberOps = "greater_than" // ✅
    const numOp2: NumberOps = "less_than" // ✅
    const numOp3: NumberOps = "equals" // ✅
    // const invalidNumOp: NumberOps = "starts_with"; // ❌ Should be TypeScript error

    // Select field operators
    type SelectOps = OperatorsFor<"Category", typeof TestDatabaseFieldTypes>
    const selectOp: SelectOps = "equals" // ✅
    const selectOp2: SelectOps = "does_not_equal" // ✅
    // const invalidSelectOp: SelectOps = "greater_than"; // ❌ Should be TypeScript error

    // Multi-select field operators
    type MultiSelectOps = OperatorsFor<"Tags", typeof TestDatabaseFieldTypes>
    const multiOp: MultiSelectOps = "contains" // ✅
    const multiOp2: MultiSelectOps = "does_not_contain" // ✅
    // const invalidMultiOp: MultiSelectOps = "after"; // ❌ Should be TypeScript error

    expect(dateOp).toBe("after")
    expect(numOp).toBe("greater_than")
    expect(selectOp).toBe("equals")
    expect(multiOp).toBe("contains")
  })
})

// ============================================================================
// VALUE TYPE VALIDATION TESTS
// ============================================================================

/**
 * Test that value types are correctly inferred based on field metadata
 */
describe("Value Type Extraction", () => {
  test("should extract correct value types for different field types", () => {
    // Title field
    type TitleValue = ValueTypeFor<"Title", typeof TestDatabaseFieldTypes>
    const validTitleValue: TitleValue = "Hello World" // ✅
    // const invalidTitleValue: TitleValue = 123; // ❌ Should be TypeScript error

    // Number field
    type PriceValue = ValueTypeFor<"Price", typeof TestDatabaseFieldTypes>
    const validPriceValue: PriceValue = 29.99 // ✅
    // const invalidPriceValue: PriceValue = "expensive"; // ❌ Should be TypeScript error

    // Boolean field
    type ActiveValue = ValueTypeFor<"Is Active", typeof TestDatabaseFieldTypes>
    const validActiveValue: ActiveValue = true // ✅
    // const invalidActiveValue: ActiveValue = "yes"; // ❌ Should be TypeScript error

    // Select field (constrained to options)
    type CategoryValue = ValueTypeFor<"Category", typeof TestDatabaseFieldTypes>
    const validCategoryValue: CategoryValue = "Electronics" // ✅
    // const invalidCategoryValue: CategoryValue = "InvalidCategory"; // ❌ Should be TypeScript error

    // Multi-select field (single option for filter operations)
    type TagsValue = ValueTypeFor<"Tags", typeof TestDatabaseFieldTypes>
    const validTagsValue: TagsValue = "New" // ✅ Single option for contains operation
    // const invalidTagsValue: TagsValue = "InvalidTag"; // ❌ Should be TypeScript error

    expect(validTitleValue).toBe("Hello World")
    expect(validPriceValue).toBe(29.99)
    expect(validActiveValue).toBe(true)
    expect(validCategoryValue).toBe("Electronics")
    expect(validTagsValue).toBe("New")
  })
})
