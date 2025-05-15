import { Client } from "@notionhq/client";
import {
  QueryDatabaseParameters,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { DatabaseRecord, simplifyNotionRecords } from "./generator";
import { debug } from "./utils/debug";

export type SortDirection = "ascending" | "descending";
export type ComparisonOperator =
  | "equals"
  | "does_not_equal"
  | "contains"
  | "does_not_contain"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal_to"
  | "less_than_or_equal_to"
  | "is_empty"
  | "is_not_empty";

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
  | "unique_id";

// Interface for database field metadata
export interface DatabaseFieldMetadata {
  [fieldName: string]: NotionFieldType;
}

export interface FilterCondition {
  property: string;
  type: string;
  value: any;
  propertyType?: string; // Property type to use when building Notion filters (e.g., "checkbox", "rich_text", "number")
}

export interface QueryResult<T extends DatabaseRecord> {
  results: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

// Abstract base class for all filter builders
export abstract class BaseFilterBuilder<
  T extends DatabaseRecord,
  K extends keyof T & string,
  M extends DatabaseFieldMetadata = {}
> {
  constructor(protected property: K, protected parent: QueryBuilder<T, M>) {}

  // Common methods for all field types
  equals<V extends T[K]>(value: V): QueryBuilder<T, M> {
    return this.addFilter("equals", value);
  }

  notEquals<V extends T[K]>(value: V): QueryBuilder<T, M> {
    return this.addFilter("does_not_equal", value);
  }

  isEmpty(): QueryBuilder<T, M> {
    return this.addFilter("is_empty", true);
  }

  isNotEmpty(): QueryBuilder<T, M> {
    return this.addFilter("is_not_empty", true);
  }

  protected addFilter(
    type: string,
    value: any,
    propertyType?: string
  ): QueryBuilder<T, M> {
    const determinedType = propertyType || this.determinePropertyType(value);
    this.parent.addCondition({
      property: this.property,
      type,
      value,
      propertyType: determinedType,
    });
    return this.parent;
  }

  // Helper method to determine property type from value
  private determinePropertyType(value: any): string {
    if (typeof value === "boolean") {
      return "checkbox";
    } else if (typeof value === "number") {
      return "number";
    } else if (value instanceof Date) {
      return "date";
    } else if (Array.isArray(value)) {
      return "multi_select";
    } else if (typeof value === "string") {
      return "rich_text";
    }
    return "rich_text"; // Default fallback
  }
}

// Text field specific filter builder (for title and rich_text)
export class TextFilterBuilder<
  T extends DatabaseRecord,
  K extends keyof T & string,
  M extends DatabaseFieldMetadata = {}
> extends BaseFilterBuilder<T, K, M> {
  contains(value: string): QueryBuilder<T, M> {
    return this.addFilter("contains", value, "rich_text");
  }

  notContains(value: string): QueryBuilder<T, M> {
    return this.addFilter("does_not_contain", value, "rich_text");
  }

  startsWith(value: string): QueryBuilder<T, M> {
    return this.addFilter("starts_with", value, "rich_text");
  }

  endsWith(value: string): QueryBuilder<T, M> {
    return this.addFilter("ends_with", value, "rich_text");
  }
}

// Number field specific filter builder
export class NumberFilterBuilder<
  T extends DatabaseRecord,
  K extends keyof T & string,
  M extends DatabaseFieldMetadata = {}
> extends BaseFilterBuilder<T, K, M> {
  greaterThan(value: number): QueryBuilder<T, M> {
    return this.addFilter("greater_than", value, "number");
  }

  lessThan(value: number): QueryBuilder<T, M> {
    return this.addFilter("less_than", value, "number");
  }

  greaterThanOrEqual(value: number): QueryBuilder<T, M> {
    return this.addFilter("greater_than_or_equal_to", value, "number");
  }

  lessThanOrEqual(value: number): QueryBuilder<T, M> {
    return this.addFilter("less_than_or_equal_to", value, "number");
  }
}

// Date field specific filter builder
export class DateFilterBuilder<
  T extends DatabaseRecord,
  K extends keyof T & string,
  M extends DatabaseFieldMetadata = {}
> extends BaseFilterBuilder<T, K, M> {
  greaterThan(value: Date): QueryBuilder<T, M> {
    return this.addFilter("greater_than", value.toISOString(), "date");
  }

  lessThan(value: Date): QueryBuilder<T, M> {
    return this.addFilter("less_than", value.toISOString(), "date");
  }

  greaterThanOrEqual(value: Date): QueryBuilder<T, M> {
    return this.addFilter(
      "greater_than_or_equal_to",
      value.toISOString(),
      "date"
    );
  }

  lessThanOrEqual(value: Date): QueryBuilder<T, M> {
    return this.addFilter("less_than_or_equal_to", value.toISOString(), "date");
  }

  // Allow string dates as well (ISO format)
  onDate(value: string | Date): QueryBuilder<T, M> {
    const dateString =
      value instanceof Date ? value.toISOString().split("T")[0] : value;
    return this.addFilter("equals", dateString, "date");
  }
}

// Select field specific filter builder
export class SelectFilterBuilder<
  T extends DatabaseRecord,
  K extends keyof T & string,
  M extends DatabaseFieldMetadata = {}
> extends BaseFilterBuilder<T, K, M> {
  // Only inherits equals, notEquals, isEmpty, isNotEmpty from base class
  // This specialization ensures we don't expose text methods that would fail
}

// Multi-select field specific filter builder
export class MultiSelectFilterBuilder<
  T extends DatabaseRecord,
  K extends keyof T & string,
  M extends DatabaseFieldMetadata = {}
> extends BaseFilterBuilder<T, K, M> {
  contains(value: string): QueryBuilder<T, M> {
    return this.addFilter("contains", value, "multi_select");
  }
}

// Checkbox field specific filter builder
export class CheckboxFilterBuilder<
  T extends DatabaseRecord,
  K extends keyof T & string,
  M extends DatabaseFieldMetadata = {}
> extends BaseFilterBuilder<T, K, M> {
  // Only inherits equals, notEquals, isEmpty, isNotEmpty
  // This is just for type clarity
}

// Legacy FilterBuilder to be replaced in Bucket 2
export class FilterBuilder<
  T extends DatabaseRecord,
  K extends keyof T & string,
  M extends DatabaseFieldMetadata = {}
> {
  constructor(private property: K, private parent: QueryBuilder<T, M>) {}

  /**
   * Add an equals filter for the property with the given value.
   * Automatically determines the correct Notion property type based on the value's type.
   * For example, boolean values will use the "checkbox" property type.
   */
  equals<V extends T[K] extends string ? T[K] : any>(
    value: V
  ): QueryBuilder<T, M> {
    const propertyType = this.determinePropertyType(value);
    return this.addFilter("equals", value, propertyType);
  }

  notEquals<V extends T[K] extends string ? T[K] : any>(
    value: V
  ): QueryBuilder<T, M> {
    const propertyType = this.determinePropertyType(value);
    return this.addFilter("does_not_equal", value, propertyType);
  }

  contains(value: string): QueryBuilder<T, M> {
    return this.addFilter("contains", value, "rich_text");
  }

  notContains(value: string): QueryBuilder<T, M> {
    return this.addFilter("does_not_contain", value, "rich_text");
  }

  startsWith(value: string): QueryBuilder<T, M> {
    return this.addFilter("starts_with", value, "rich_text");
  }

  endsWith(value: string): QueryBuilder<T, M> {
    return this.addFilter("ends_with", value, "rich_text");
  }

  greaterThan(value: number | string | Date): QueryBuilder<T, M> {
    const processedValue = value instanceof Date ? value.toISOString() : value;
    const propertyType =
      value instanceof Date
        ? "date"
        : typeof value === "number"
        ? "number"
        : "rich_text";
    return this.addFilter("greater_than", processedValue, propertyType);
  }

  lessThan(value: number | string | Date): QueryBuilder<T, M> {
    const processedValue = value instanceof Date ? value.toISOString() : value;
    const propertyType =
      value instanceof Date
        ? "date"
        : typeof value === "number"
        ? "number"
        : "rich_text";
    return this.addFilter("less_than", processedValue, propertyType);
  }

  greaterThanOrEqual(value: number | string | Date): QueryBuilder<T, M> {
    const processedValue = value instanceof Date ? value.toISOString() : value;
    const propertyType =
      value instanceof Date
        ? "date"
        : typeof value === "number"
        ? "number"
        : "rich_text";
    return this.addFilter(
      "greater_than_or_equal_to",
      processedValue,
      propertyType
    );
  }

  lessThanOrEqual(value: number | string | Date): QueryBuilder<T, M> {
    const processedValue = value instanceof Date ? value.toISOString() : value;
    const propertyType =
      value instanceof Date
        ? "date"
        : typeof value === "number"
        ? "number"
        : "rich_text";
    return this.addFilter(
      "less_than_or_equal_to",
      processedValue,
      propertyType
    );
  }

  isEmpty(): QueryBuilder<T, M> {
    return this.addFilter("is_empty", true, "checkbox");
  }

  isNotEmpty(): QueryBuilder<T, M> {
    return this.addFilter("is_not_empty", true, "checkbox");
  }

  includes(value: string): QueryBuilder<T, M> {
    return this.addFilter("contains", value, "rich_text");
  }

  includesAny(values: string[]): QueryBuilder<T, M> {
    // Create "or" conditions for each value
    return this.parent.or(
      values.map((value) => (q: QueryBuilder<T, M>) => {
        const filterBuilder = q.filter(this.property as keyof T & string);
        // Check if this filter builder supports the contains method
        if (
          filterBuilder instanceof TextFilterBuilder ||
          filterBuilder instanceof MultiSelectFilterBuilder
        ) {
          return (
            filterBuilder as TextFilterBuilder<T, typeof this.property, M>
          ).contains(value);
        }
        throw new Error(
          `Property ${String(
            this.property
          )} does not support 'contains' operation`
        );
      })
    );
  }

  includesAll(values: string[]): QueryBuilder<T, M> {
    // Create "and" conditions for each value
    return this.parent.and(
      values.map((value) => (q: QueryBuilder<T, M>) => {
        const filterBuilder = q.filter(this.property as keyof T & string);
        // Check if this filter builder supports the contains method
        if (
          filterBuilder instanceof TextFilterBuilder ||
          filterBuilder instanceof MultiSelectFilterBuilder
        ) {
          return (
            filterBuilder as TextFilterBuilder<T, typeof this.property, M>
          ).contains(value);
        }
        throw new Error(
          `Property ${String(
            this.property
          )} does not support 'contains' operation`
        );
      })
    );
  }

  /**
   * Determines the appropriate Notion property type based on the value type.
   * This is essential for correctly building filters that match Notion's API expectations:
   * - boolean values → checkbox property type
   * - number values → number property type
   * - Date objects → date property type
   * - arrays → multi_select property type
   * - strings → rich_text property type (or select if from an enum)
   */
  private determinePropertyType(value: any): string {
    if (typeof value === "boolean") {
      return "checkbox";
    } else if (typeof value === "number") {
      return "number";
    } else if (value instanceof Date) {
      return "date";
    } else if (Array.isArray(value)) {
      return "multi_select";
    } else {
      console.log("could not determine property type, returning rich_text");
      console.log("value", value);

      if (typeof value === "string") {
        // Try to infer if this is a select property based on T and property K
        // For now, default to rich_text for strings
        return "rich_text";
      }
    }
    return "rich_text"; // Default fallback
  }

  private addFilter(
    type: string,
    value: any,
    propertyType?: string
  ): QueryBuilder<T, M> {
    this.parent.addCondition({
      property: this.property,
      type,
      value,
      propertyType,
    });
    return this.parent;
  }
}

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

  constructor(client: Client, databaseId: string, fieldTypes: M = {} as M) {
    this.client = client;
    this.databaseId = databaseId;
    this.fieldTypes = fieldTypes;
  }

  /**
   * Creates a filter for the specified property
   * Returns a specialized filter builder based on the property's type
   */
  filter<K extends keyof T & string>(property: K): BaseFilterBuilder<T, K, M> {
    // Get the field type from metadata or infer it
    const fieldType = this.getFieldType(property);

    // Create the appropriate filter builder based on field type
    switch (fieldType) {
      case "rich_text":
      case "title":
        return new TextFilterBuilder<T, K, M>(property, this);

      case "number":
        return new NumberFilterBuilder<T, K, M>(property, this);

      case "date":
      case "created_time":
      case "last_edited_time":
        return new DateFilterBuilder<T, K, M>(property, this);

      case "select":
        return new SelectFilterBuilder<T, K, M>(property, this);

      case "multi_select":
        return new MultiSelectFilterBuilder<T, K, M>(property, this);

      case "checkbox":
        return new CheckboxFilterBuilder<T, K, M>(property, this);

      default:
        // Default to text filter for unknown types
        return new TextFilterBuilder<T, K, M>(property, this);
    }
  }

  /**
   * Get the field type from metadata or infer it
   * @private
   */
  private getFieldType(property: keyof T & string): NotionFieldType {
    // If we have field metadata, use it
    if (this.fieldTypes && property in this.fieldTypes) {
      return this.fieldTypes[property];
    }

    // Try to infer from common property names
    if (property === "Title" || property.includes("title")) {
      return "title";
    }

    if (
      property.includes("date") ||
      property.includes("Date") ||
      property.includes("time") ||
      property.includes("Time")
    ) {
      return "date";
    }

    if (
      property.includes("is") ||
      property.includes("has") ||
      property.includes("can")
    ) {
      return "checkbox";
    }

    // Default to rich_text for unknown properties
    return "rich_text";
  }

  sort(
    property: keyof T & string,
    direction: SortDirection = "ascending"
  ): QueryBuilder<T, M> {
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

  and(
    builders: ((q: QueryBuilder<T, M>) => QueryBuilder<T, M>)[]
  ): QueryBuilder<T, M> {
    return this.logicalGroup("and", builders);
  }

  or(
    builders: ((q: QueryBuilder<T, M>) => QueryBuilder<T, M>)[]
  ): QueryBuilder<T, M> {
    return this.logicalGroup("or", builders);
  }

  addCondition(condition: FilterCondition): void {
    this.filterConditions.push(condition);
  }

  private logicalGroup(
    operator: LogicalOperator,
    builders: ((q: QueryBuilder<T, M>) => QueryBuilder<T, M>)[]
  ): QueryBuilder<T, M> {
    const conditions = builders
      .map((builder) => {
        const subQuery = new QueryBuilder<T, M>(
          this.client,
          this.databaseId,
          this.fieldTypes
        );
        builder(subQuery);
        const filter = subQuery.buildFilter();
        return filter;
      })
      .filter((filter) => filter !== undefined && filter !== null);

    if (conditions.length > 0) {
      this.nestedFilters.push({
        [operator]: conditions,
      });
    }

    return this;
  }

  private buildFilter(): any {
    const filters: any[] = [];

    // Add simple filters
    this.filterConditions.forEach((condition) => {
      const { property, type, value, propertyType } = condition;

      // Create properly nested filter object based on Notion API requirements
      const filter: any = {
        property,
      };

      // Determine property type (either from condition or from operation type)
      const notionPropertyType = propertyType || property_type(type, value);

      // Add the appropriate property for the filter type
      // Notion expects filters to have a nested structure based on property type
      filter[notionPropertyType] = {
        [type]: value,
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
   * Sets the query to return exactly one result.
   * Will throw an error if no records are found or if multiple records match.
   */
  single(): QueryBuilder<T, M> {
    this.singleMode = "required";
    // Limit to 2 to check if there are multiple matches
    this.pageLimit = 2;
    return this;
  }

  /**
   * Sets the query to return at most one result.
   * Returns null if no records are found.
   */
  maybeSingle(): QueryBuilder<T, M> {
    this.singleMode = "optional";
    // Limit to 1 since we only need the first match
    this.pageLimit = 1;
    return this;
  }

  /**
   * Implementation of the PromiseLike interface.
   * This allows QueryBuilder to be used directly with await.
   */
  then<TResult1 = T[] | T | null, TResult2 = never>(
    onfulfilled?:
      | ((value: T[] | T | null) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    // Execute the query and chain the promise
    return this.execute().then(onfulfilled, onrejected);
  }

  /**
   * Execute the query and return the results.
   * This method is called automatically when the query is awaited.
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
      const results = simplifyNotionRecords(pages) as T[];

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

  // Temporary method to support legacy FilterBuilder until we remove it completely
  // This will only be needed temporarily during transition to the new API
  queryWithLegacyBuilder<K extends keyof T & string>(
    property: K
  ): FilterBuilder<T, K, M> {
    return new FilterBuilder<T, K, M>(property, this);
  }
}

/**
 * Helper function to determine the Notion property type to use based on:
 * 1. The value being filtered (if provided)
 * 2. The filter operation type as a fallback
 *
 * This is critical for correctly constructing Notion API filter objects that
 * match the expected structure for each property type. For example:
 * - Boolean values need to use the "checkbox" property type
 * - Dates need to use the "date" property type
 * - Numbers need to use the "number" property type
 */
function property_type(filterType: string, value?: any): string {
  // First determine property type from the value if available
  if (value !== undefined) {
    if (typeof value === "boolean") {
      return "checkbox";
    } else if (typeof value === "number") {
      return "number";
    } else if (value instanceof Date) {
      return "date";
    } else if (Array.isArray(value)) {
      return "multi_select";
    }
    // If it's a string, we'll fallback to the operation-based mapping below
  }

  // Map filter operation types to Notion property types as fallback
  switch (filterType) {
    case "equals":
    case "does_not_equal":
    case "contains":
    case "does_not_contain":
    case "starts_with":
    case "ends_with":
      return "rich_text"; // Default to rich_text for string operations
    case "greater_than":
    case "less_than":
    case "greater_than_or_equal_to":
    case "less_than_or_equal_to":
      return "number"; // Use number for numeric comparisons
    case "is_empty":
    case "is_not_empty":
      return "checkbox"; // Use checkbox for boolean operations
    default:
      return "rich_text"; // Default fallback
  }
}
