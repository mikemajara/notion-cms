import { Client } from "@notionhq/client";
import {
  QueryDatabaseParameters,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { DatabaseRecord } from "./generator";
import { debug } from "./utils/debug";
import { FileManager } from "./file-manager";
import { DatabaseService } from "./database-service";

export type SortDirection = "ascending" | "descending";
export type LogicalOperator = "and" | "or";

// Define all possible Notion field types
export type NotionFieldType =
  | "title"
  | "rich_text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "people"
  | "files"
  | "checkbox"
  | "url"
  | "email"
  | "phone_number"
  | "formula"
  | "relation"
  | "rollup"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by"
  | "status"
  | "unique_id"
  | "verification"
  | "unknown";

// ============================================================================
// NEW TYPE SYSTEM FOUNDATION
// ============================================================================

/**
 * Comprehensive operator mapping for all Notion field types
 * Each field type has specific operators that make sense for that data type
 */
export type OperatorMap = {
  // Text-based fields
  title:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty";
  rich_text:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty";
  url:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty";
  email:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty";
  phone_number:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty";

  // Numeric fields
  number:
    | "equals"
    | "does_not_equal"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal_to"
    | "less_than_or_equal_to"
    | "is_empty"
    | "is_not_empty";

  // Selection fields
  select: "equals" | "does_not_equal" | "is_empty" | "is_not_empty";
  multi_select: "contains" | "does_not_contain" | "is_empty" | "is_not_empty";
  status: "equals" | "does_not_equal" | "is_empty" | "is_not_empty";

  // Date/time fields
  date:
    | "equals"
    | "before"
    | "after"
    | "on_or_before"
    | "on_or_after"
    | "is_empty"
    | "is_not_empty";
  created_time: "equals" | "before" | "after" | "on_or_before" | "on_or_after";
  last_edited_time:
    | "equals"
    | "before"
    | "after"
    | "on_or_before"
    | "on_or_after";

  // Boolean fields
  checkbox: "equals";

  // Relation fields
  people: "contains" | "does_not_contain" | "is_empty" | "is_not_empty";
  relation: "contains" | "does_not_contain" | "is_empty" | "is_not_empty";
  created_by: "contains" | "does_not_contain";
  last_edited_by: "contains" | "does_not_contain";

  // File fields
  files: "is_empty" | "is_not_empty";

  // Special fields
  formula:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal_to"
    | "less_than_or_equal_to"
    | "is_empty"
    | "is_not_empty";
  rollup:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal_to"
    | "less_than_or_equal_to"
    | "is_empty"
    | "is_not_empty";
  unique_id:
    | "equals"
    | "does_not_equal"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal_to"
    | "less_than_or_equal_to";
  verification: "equals" | "before" | "after" | "on_or_before" | "on_or_after";

  // Fallback
  unknown: "equals" | "does_not_equal" | "is_empty" | "is_not_empty";
};

/**
 * Runtime version of OperatorMap for validation purposes
 * This allows us to check valid operators at runtime
 */
export const OPERATOR_MAP: Record<keyof OperatorMap, readonly string[]> = {
  // Text-based fields
  title: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty",
  ] as const,
  rich_text: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty",
  ] as const,
  url: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty",
  ] as const,
  email: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty",
  ] as const,
  phone_number: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty",
  ] as const,

  // Numeric fields
  number: [
    "equals",
    "does_not_equal",
    "greater_than",
    "less_than",
    "greater_than_or_equal_to",
    "less_than_or_equal_to",
    "is_empty",
    "is_not_empty",
  ] as const,

  // Selection fields
  select: ["equals", "does_not_equal", "is_empty", "is_not_empty"] as const,
  multi_select: [
    "contains",
    "does_not_contain",
    "is_empty",
    "is_not_empty",
  ] as const,
  status: ["equals", "does_not_equal", "is_empty", "is_not_empty"] as const,

  // Date/time fields
  date: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after",
    "is_empty",
    "is_not_empty",
  ] as const,
  created_time: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after",
  ] as const,
  last_edited_time: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after",
  ] as const,

  // Boolean fields
  checkbox: ["equals"] as const,

  // Relation fields
  people: ["contains", "does_not_contain", "is_empty", "is_not_empty"] as const,
  relation: [
    "contains",
    "does_not_contain",
    "is_empty",
    "is_not_empty",
  ] as const,
  created_by: ["contains", "does_not_contain"] as const,
  last_edited_by: ["contains", "does_not_contain"] as const,

  // File fields
  files: ["is_empty", "is_not_empty"] as const,

  // Special fields
  formula: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "greater_than",
    "less_than",
    "greater_than_or_equal_to",
    "less_than_or_equal_to",
    "is_empty",
    "is_not_empty",
  ] as const,
  rollup: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "greater_than",
    "less_than",
    "greater_than_or_equal_to",
    "less_than_or_equal_to",
    "is_empty",
    "is_not_empty",
  ] as const,
  unique_id: [
    "equals",
    "does_not_equal",
    "greater_than",
    "less_than",
    "greater_than_or_equal_to",
    "less_than_or_equal_to",
  ] as const,
  verification: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after",
  ] as const,
  // Fallback
  unknown: ["equals", "does_not_equal", "is_empty", "is_not_empty"] as const,
} as const;

/**
 * Enhanced interface for database field metadata with full type constraints
 * Supports all Notion field types with proper option constraints for select fields
 */
export interface DatabaseFieldMetadata {
  [fieldName: string]:
    | { type: Exclude<NotionFieldType, "select" | "multi_select"> }
    | { type: "select"; options: readonly string[] }
    | { type: "multi_select"; options: readonly string[] };
}

/**
 * Conditional type utilities for type-safe query building
 */

// Extract the field type from metadata for a specific field
export type FieldTypeFor<
  K extends keyof M,
  M extends DatabaseFieldMetadata
> = M[K] extends { type: infer T } ? T : never;

// Get valid operators for a specific field based on its type
export type OperatorsFor<
  K extends keyof M,
  M extends DatabaseFieldMetadata
> = FieldTypeFor<K, M> extends keyof OperatorMap
  ? OperatorMap[FieldTypeFor<K, M>]
  : never;

// Extract select options from field metadata
export type SelectOptionsFor<
  K extends keyof M,
  M extends DatabaseFieldMetadata
> = M[K] extends { type: "select"; options: readonly (infer U)[] }
  ? U
  : M[K] extends { type: "multi_select"; options: readonly (infer U)[] }
  ? U
  : never;

// Map field types to their corresponding TypeScript value types
export type ValueTypeMap = {
  title: string;
  rich_text: string;
  number: number;
  select: string; // Will be further constrained by SelectOptionsFor
  multi_select: string[]; // Will be further constrained by MultiSelectOptionsFor
  date: Date | string; // Allow both Date objects and ISO strings
  people: string[]; // Array of user IDs
  files: Array<{ name: string; url: string }>;
  checkbox: boolean;
  url: string;
  email: string;
  phone_number: string;
  formula: any; // Formula results can be various types
  relation: string[]; // Array of related page IDs
  rollup: any; // Rollup results can be various types
  created_time: Date | string;
  created_by: string; // User ID
  last_edited_time: Date | string;
  last_edited_by: string; // User ID
  status: string;
  unique_id: number;
  unknown: any;
};

// Get the expected value type for a field based on its metadata type
export type ValueTypeFor<
  K extends keyof M,
  M extends DatabaseFieldMetadata,
  T extends DatabaseRecord = DatabaseRecord,
  O extends OperatorsFor<K, M> = OperatorsFor<K, M>
> = O extends "is_empty" | "is_not_empty"
  ? any // is_empty and is_not_empty operators ignore the value
  : FieldTypeFor<K, M> extends "select"
  ? SelectOptionsFor<K, M>
  : FieldTypeFor<K, M> extends "multi_select"
  ? SelectOptionsFor<K, M> // Single option value for contains/does_not_contain operations
  : FieldTypeFor<K, M> extends "people" | "relation"
  ? O extends "contains" | "does_not_contain"
    ? string // People and relation contains/does_not_contain expect single ID
    : ValueTypeMap[FieldTypeFor<K, M>]
  : FieldTypeFor<K, M> extends keyof ValueTypeMap
  ? ValueTypeMap[FieldTypeFor<K, M>]
  : any;

/**
 * Type-safe filter condition with operator and value validation
 */
export interface TypeSafeFilterCondition<
  K extends keyof M,
  M extends DatabaseFieldMetadata,
  T extends DatabaseRecord
> {
  property: K;
  operator: OperatorsFor<K, M>;
  value: ValueTypeFor<K, M, T>;
  propertyType: FieldTypeFor<K, M>;
}

/**
 * Generic filter condition for internal use
 */
export interface FilterCondition {
  property: string;
  operator: string;
  value: any;
  propertyType?: string;
}

export interface QueryResult<T extends DatabaseRecord> {
  results: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

// ============================================================================
// QUERY BUILDER FOUNDATION (placeholder for Phase 2)
// ============================================================================

export class QueryBuilder<
  T extends DatabaseRecord,
  M extends DatabaseFieldMetadata = {}
> implements PromiseLike<T[] | T | null>
{
  private client: Client;
  private databaseId: string;
  private fieldTypes: M;
  private filterConditions: FilterCondition[] = [];
  private logicalOperator: LogicalOperator = "and";
  private nestedFilters: any[] = [];
  private sortOptions: QueryDatabaseParameters["sorts"] = [];
  private pageLimit: number = 100;
  private startCursor?: string;
  private singleMode: "required" | "optional" | null = null;
  private fileManager?: FileManager;
  private databaseService: DatabaseService;

  constructor(
    client: Client,
    databaseId: string,
    fieldTypes: M = {} as M,
    fileManager?: FileManager
  ) {
    this.client = client;
    this.databaseId = databaseId;
    this.fieldTypes = fieldTypes;
    this.fileManager = fileManager;
    // Create DatabaseService instance for unified record processing
    this.databaseService = new DatabaseService(
      client,
      fileManager || new FileManager({})
    );
  }

  /**
   * Type-safe filter method with perfect IntelliSense support
   *
   * Provides:
   * 1. Field name suggestions from database metadata
   * 2. Operator suggestions based on field type
   * 3. Value type validation based on field type and select options
   *
   * @param property - Database field name (with IntelliSense suggestions)
   * @param operator - Valid operator for the field type (with IntelliSense suggestions)
   * @param value - Value matching the field type constraints
   * @returns QueryBuilder for chaining
   */
  filter<K extends keyof M & keyof T & string, O extends OperatorsFor<K, M>>(
    property: K,
    operator: O,
    value: ValueTypeFor<K, M, T, O>
  ): QueryBuilder<T, M> {
    // Validate that the operator is valid for the field type
    if (!this.isValidOperatorForField(property, operator as string)) {
      throw new Error(
        `Invalid operator "${operator}" for field "${property}" of type "${this.getFieldTypeForFilter(
          property
        )}"`
      );
    }

    // Get the property type for the Notion API
    const fieldType = this.getFieldTypeForFilter(property);
    const propertyType = this.mapFieldTypeToNotionProperty(fieldType);

    // Add the filter condition
    this.filterConditions.push({
      property: property as string,
      operator: operator as string,
      value: this.prepareFilterValue(fieldType, operator as string, value),
      propertyType,
    });

    return this;
  }

  /**
   * Map our field types to Notion API property types
   * @private
   */
  private mapFieldTypeToNotionProperty(
    fieldType: NotionFieldType | undefined
  ): string {
    if (!fieldType) return "rich_text"; // fallback

    switch (fieldType) {
      case "title":
        return "title";
      case "rich_text":
        return "rich_text";
      case "number":
        return "number";
      case "select":
        return "select";
      case "multi_select":
        return "multi_select";
      case "date":
      case "created_time":
      case "last_edited_time":
        return "date";
      case "checkbox":
        return "checkbox";
      case "people":
      case "created_by":
      case "last_edited_by":
        return "people";
      case "files":
        return "files";
      case "url":
        return "url";
      case "email":
        return "email";
      case "phone_number":
        return "phone_number";
      case "relation":
        return "relation";
      case "formula":
        return "formula";
      case "rollup":
        return "rollup";
      case "status":
        return "status";
      case "unique_id":
        return "unique_id";
      default:
        return "rich_text";
    }
  }

  /**
   * Prepare filter value for Notion API
   * @private
   */
  private prepareFilterValue(
    fieldType: NotionFieldType | undefined,
    operator: string,
    value: any
  ): any {
    // Handle empty/not empty operators
    if (operator === "is_empty" || operator === "is_not_empty") {
      return true;
    }

    // Handle date values
    if (
      fieldType === "date" ||
      fieldType === "created_time" ||
      fieldType === "last_edited_time"
    ) {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value; // assume it's already a valid date string
    }

    // Handle multi-select contains (expects a string, not array)
    if (
      fieldType === "multi_select" &&
      (operator === "contains" || operator === "does_not_contain")
    ) {
      // If value is an array, take the first element
      if (Array.isArray(value)) {
        return value[0] || "";
      }
      return value;
    }

    return value;
  }

  /**
   * Add sorting to the query with type-safe field name suggestions
   *
   * Supports both single and multiple (nested) sorting. When multiple sorts are applied,
   * the first sort takes precedence, then the second, and so on.
   *
   * All field types support sorting in Notion, including:
   * - Text fields (title, rich_text, url, email, phone_number)
   * - Number fields
   * - Date fields (date, created_time, last_edited_time)
   * - Select and multi-select fields
   * - Checkbox fields
   * - People and relation fields
   * - Status fields
   * - Formula and rollup fields
   *
   * @param property - Field name to sort by (with IntelliSense suggestions from database schema)
   * @param direction - Sort direction: "ascending" (default) or "descending"
   * @returns QueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * // Single sort
   * query(cms, databaseId)
   *   .sort("Created Date", "descending")
   *
   * // Multiple (nested) sorts - priority order matters
   * query(cms, databaseId)
   *   .sort("Priority", "descending")    // Primary sort
   *   .sort("Created Date", "ascending") // Secondary sort
   *   .sort("Name", "ascending")         // Tertiary sort
   *
   * // Sort by different field types
   * query(cms, databaseId)
   *   .sort("Environment", "ascending")           // Select field
   *   .sort("Estimated Cost", "descending")       // Number field
   *   .sort("Is Active", "descending")            // Checkbox field
   * ```
   */
  sort(
    property: keyof M & keyof T & string,
    direction: SortDirection = "ascending"
  ): QueryBuilder<T, M> {
    // Validate that the property exists in the field metadata
    if (!this.isValidSortField(property)) {
      throw new Error(
        `Invalid sort property "${property}". Property not found in database schema. ` +
          `Available fields: ${Object.keys(this.fieldTypes).join(", ")}`
      );
    }

    // Validate sort direction
    if (direction !== "ascending" && direction !== "descending") {
      throw new Error(
        `Invalid sort direction "${direction}". Must be "ascending" or "descending".`
      );
    }

    debug.log(`Adding sort: ${property} ${direction}`);

    (this.sortOptions as any[]).push({
      property,
      direction,
    });
    return this;
  }

  limit(limit: number): QueryBuilder<T, M> {
    this.pageLimit = limit;
    return this;
  }

  startAfter(cursor: string): QueryBuilder<T, M> {
    this.startCursor = cursor;
    return this;
  }

  single(): QueryBuilder<T, M> {
    this.singleMode = "required";
    // Limit to 2 to check if there are multiple matches
    this.pageLimit = 2;
    return this;
  }

  maybeSingle(): QueryBuilder<T, M> {
    this.singleMode = "optional";
    // Limit to 1 since we only need the first match
    this.pageLimit = 1;
    return this;
  }

  then<TResult1 = T[] | T | null, TResult2 = never>(
    onfulfilled?:
      | ((value: T[] | T | null) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  /**
   * Execute the query and return the results
   * @private
   */
  private async execute(): Promise<T[] | T | null> {
    const { results } = await this.paginate(this.pageLimit);

    if (this.singleMode === "required") {
      if (results.length === 0) {
        throw new Error("No records found matching the query");
      }
      if (results.length > 1) {
        throw new Error("Multiple records found when expecting exactly one");
      }
      return results[0];
    }

    if (this.singleMode === "optional") {
      return results.length > 0 ? results[0] : null;
    }

    return results;
  }

  async paginate(pageSize: number = 100): Promise<QueryResult<T>> {
    const filter = this.buildFilter();

    try {
      debug.query(this.databaseId, {
        database_id: this.databaseId,
        filter: filter || undefined,
        sorts: this.sortOptions,
        page_size: pageSize,
        start_cursor: this.startCursor,
      });

      const response = await this.client.databases.query({
        database_id: this.databaseId,
        filter: filter || undefined,
        sorts:
          this.sortOptions && this.sortOptions.length > 0
            ? this.sortOptions
            : undefined,
        page_size: pageSize,
        start_cursor: this.startCursor,
      });

      debug.log(`Query returned ${response.results.length} results`);

      const pages = response.results as PageObjectResponse[];

      // Debug logging
      debug.log(`[QueryBuilder] FileManager present:`, !!this.fileManager);
      debug.log(
        `[QueryBuilder] Cache enabled:`,
        this.fileManager?.isCacheEnabled()
      );

      // Always use unified processing - FileManager strategy handles caching behavior
      debug.log(
        `[QueryBuilder] Using unified processing with ${pages.length} pages`
      );
      const results = await this.databaseService.processNotionRecords<T>(pages);
      debug.log(
        `[QueryBuilder] Processed ${results.length} records with unified processing`
      );

      return {
        results,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
      };
    } catch (error) {
      debug.error(error, {
        databaseId: this.databaseId,
        filter,
        sorts: this.sortOptions,
        pageSize,
        startCursor: this.startCursor,
      });
      throw error;
    }
  }

  async all(): Promise<T[]> {
    let allResults: T[] = [];
    let hasMore = true;
    let cursor: string | null = null;

    while (hasMore) {
      if (cursor) {
        this.startAfter(cursor);
      }

      const response = await this.paginate(100);
      allResults = [...allResults, ...response.results];
      hasMore = response.hasMore;
      cursor = response.nextCursor;
    }

    return allResults;
  }

  /**
   * Build the Notion API filter from the filter conditions
   * @private
   */
  private buildFilter(): any {
    const filters: any[] = [];

    // Add simple filters
    this.filterConditions.forEach((condition) => {
      const { property, operator, value, propertyType } = condition;

      // Create properly nested filter object based on Notion API requirements
      const filter: any = {
        property,
      };

      // Use the property type from the condition
      if (!propertyType) {
        throw new Error(
          `Property type not determined for property: ${String(property)}`
        );
      }

      // Map our operators to Notion API operators
      const notionOperator = this.mapToNotionOperator(operator);

      // Add the appropriate property for the filter type
      // Notion expects filters to have a nested structure based on property type
      filter[propertyType] = {
        [notionOperator]: value,
      };

      filters.push(filter);
    });

    // Add nested filters
    filters.push(...this.nestedFilters);

    // Combine filters with the logical operator
    if (filters.length === 0) {
      return undefined;
    }

    if (filters.length === 1) {
      return filters[0];
    }

    return {
      [this.logicalOperator]: filters,
    };
  }

  /**
   * Map our operator names to Notion API operator names
   * @private
   */
  private mapToNotionOperator(operator: string): string {
    switch (operator) {
      case "equals":
        return "equals";
      case "does_not_equal":
        return "does_not_equal";
      case "contains":
        return "contains";
      case "does_not_contain":
        return "does_not_contain";
      case "starts_with":
        return "starts_with";
      case "ends_with":
        return "ends_with";
      case "greater_than":
        return "greater_than";
      case "less_than":
        return "less_than";
      case "greater_than_or_equal_to":
        return "greater_than_or_equal_to";
      case "less_than_or_equal_to":
        return "less_than_or_equal_to";
      case "before":
        return "before";
      case "after":
        return "after";
      case "on_or_before":
        return "on_or_before";
      case "on_or_after":
        return "on_or_after";
      case "is_empty":
        return "is_empty";
      case "is_not_empty":
        return "is_not_empty";
      default:
        return operator; // fallback to the same name
    }
  }

  /**
   * Get field type from metadata for a given property
   * This is used internally for type validation and filter building
   */
  getFieldTypeForFilter(
    property: keyof T & string
  ): NotionFieldType | undefined {
    const metadata = this.fieldTypes[property as keyof M];
    return metadata?.type;
  }

  /**
   * Type guard to validate if an operator is valid for a given field type
   */
  isValidOperatorForField<K extends keyof M>(
    property: K,
    operator: string
  ): operator is OperatorsFor<K, M> {
    const fieldType = this.getFieldTypeForFilter(property as keyof T & string);
    if (!fieldType || !(fieldType in OPERATOR_MAP)) {
      return false;
    }

    const validOperators = OPERATOR_MAP[fieldType as keyof typeof OPERATOR_MAP];
    return validOperators.includes(operator);
  }

  /**
   * Validate that a value is appropriate for a given field type
   */
  isValidValueForField<K extends keyof M>(
    property: K,
    value: any
  ): value is ValueTypeFor<K, M, T> {
    const fieldType = this.getFieldTypeForFilter(property as keyof T & string);

    // TODO: Implement comprehensive value validation
    // This will be expanded in Phase 2 with proper runtime validation
    return true;
  }

  /**
   * Type guard to validate if a sort property is valid in the field metadata
   */
  private isValidSortField(property: keyof M & string): boolean {
    const fieldType = this.getFieldTypeForFilter(property);
    return fieldType !== undefined;
  }
}
