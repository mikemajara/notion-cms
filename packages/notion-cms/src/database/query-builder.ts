import { Client } from "@notionhq/client"
import {
  QueryDatabaseParameters,
  PageObjectResponse
} from "@notionhq/client/build/src/api-endpoints"
import { DatabaseRecord } from "../generator"
import { debug } from "../utils/debug"
import { FileManager } from "../file-processor/file-manager"
import { getPropertyValueSimple } from "./database-record-converter/converter-record-simple"
import { getPropertyValueAdvanced } from "./database-record-converter/converter-record-advanced"

export type SortDirection = "ascending" | "descending"
export type LogicalOperator = "and" | "or"

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
  | "unknown"

export type OperatorMap = {
  title:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty"
  rich_text:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty"
  url:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty"
  email:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty"
  phone_number:
    | "equals"
    | "does_not_equal"
    | "contains"
    | "does_not_contain"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty"
  number:
    | "equals"
    | "does_not_equal"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal_to"
    | "less_than_or_equal_to"
    | "is_empty"
    | "is_not_empty"
  select: "equals" | "does_not_equal" | "is_empty" | "is_not_empty"
  multi_select: "contains" | "does_not_contain" | "is_empty" | "is_not_empty"
  status: "equals" | "does_not_equal" | "is_empty" | "is_not_empty"
  date:
    | "equals"
    | "before"
    | "after"
    | "on_or_before"
    | "on_or_after"
    | "is_empty"
    | "is_not_empty"
  created_time: "equals" | "before" | "after" | "on_or_before" | "on_or_after"
  last_edited_time:
    | "equals"
    | "before"
    | "after"
    | "on_or_before"
    | "on_or_after"
  checkbox: "equals"
  people: "contains" | "does_not_contain" | "is_empty" | "is_not_empty"
  relation: "contains" | "does_not_contain" | "is_empty" | "is_not_empty"
  created_by: "contains" | "does_not_contain"
  last_edited_by: "contains" | "does_not_contain"
  files: "is_empty" | "is_not_empty"
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
    | "is_not_empty"
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
    | "is_not_empty"
  unique_id:
    | "equals"
    | "does_not_equal"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal_to"
    | "less_than_or_equal_to"
  verification: "equals" | "before" | "after" | "on_or_before" | "on_or_after"
  unknown: "equals" | "does_not_equal" | "is_empty" | "is_not_empty"
}

export const OPERATOR_MAP: Record<keyof OperatorMap, readonly string[]> = {
  title: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty"
  ] as const,
  rich_text: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty"
  ] as const,
  url: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty"
  ] as const,
  email: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty"
  ] as const,
  phone_number: [
    "equals",
    "does_not_equal",
    "contains",
    "does_not_contain",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty"
  ] as const,
  number: [
    "equals",
    "does_not_equal",
    "greater_than",
    "less_than",
    "greater_than_or_equal_to",
    "less_than_or_equal_to",
    "is_empty",
    "is_not_empty"
  ] as const,
  select: ["equals", "does_not_equal", "is_empty", "is_not_empty"] as const,
  multi_select: [
    "contains",
    "does_not_contain",
    "is_empty",
    "is_not_empty"
  ] as const,
  status: ["equals", "does_not_equal", "is_empty", "is_not_empty"] as const,
  date: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after",
    "is_empty",
    "is_not_empty"
  ] as const,
  created_time: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after"
  ] as const,
  last_edited_time: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after"
  ] as const,
  checkbox: ["equals"] as const,
  people: ["contains", "does_not_contain", "is_empty", "is_not_empty"] as const,
  relation: [
    "contains",
    "does_not_contain",
    "is_empty",
    "is_not_empty"
  ] as const,
  created_by: ["contains", "does_not_contain"] as const,
  last_edited_by: ["contains", "does_not_contain"] as const,
  files: ["is_empty", "is_not_empty"] as const,
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
    "is_not_empty"
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
    "is_not_empty"
  ] as const,
  unique_id: [
    "equals",
    "does_not_equal",
    "greater_than",
    "less_than",
    "greater_than_or_equal_to",
    "less_than_or_equal_to"
  ] as const,
  verification: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after"
  ] as const,
  unknown: ["equals", "does_not_equal", "is_empty", "is_not_empty"] as const
} as const

export interface DatabaseFieldMetadata {
  [fieldName: string]:
    | { type: Exclude<NotionFieldType, "select" | "multi_select"> }
    | { type: "select"; options: readonly string[] }
    | { type: "multi_select"; options: readonly string[] }
}

export type FieldTypeFor<
  K extends keyof M,
  M extends DatabaseFieldMetadata
> = M[K] extends { type: infer T } ? T : never
export type OperatorsFor<
  K extends keyof M,
  M extends DatabaseFieldMetadata
> = FieldTypeFor<K, M> extends keyof OperatorMap
  ? OperatorMap[FieldTypeFor<K, M>]
  : never
export type SelectOptionsFor<
  K extends keyof M,
  M extends DatabaseFieldMetadata
> = M[K] extends { type: "select"; options: readonly (infer U)[] }
  ? U
  : M[K] extends { type: "multi_select"; options: readonly (infer U)[] }
  ? U
  : never

export type ValueTypeMap = {
  title: string
  rich_text: string
  number: number
  select: string
  multi_select: string[]
  date: Date | string
  people: string[]
  files: Array<{ name: string; url: string }>
  checkbox: boolean
  url: string
  email: string
  phone_number: string
  formula: any
  relation: string[]
  rollup: any
  created_time: Date | string
  created_by: string
  last_edited_time: Date | string
  last_edited_by: string
  status: string
  unique_id: number
  unknown: any
}

export type ValueTypeFor<
  K extends keyof M,
  M extends DatabaseFieldMetadata,
  O extends OperatorsFor<K, M> = OperatorsFor<K, M>
> = O extends "is_empty" | "is_not_empty"
  ? any
  : FieldTypeFor<K, M> extends "select"
  ? SelectOptionsFor<K, M>
  : FieldTypeFor<K, M> extends "multi_select"
  ? SelectOptionsFor<K, M>
  : FieldTypeFor<K, M> extends "people" | "relation"
  ? O extends "contains" | "does_not_contain"
    ? string
    : ValueTypeMap[FieldTypeFor<K, M>]
  : FieldTypeFor<K, M> extends keyof ValueTypeMap
  ? ValueTypeMap[FieldTypeFor<K, M>]
  : any

export interface TypeSafeFilterCondition<
  K extends keyof M,
  M extends DatabaseFieldMetadata
> {
  property: K
  operator: OperatorsFor<K, M>
  value: ValueTypeFor<K, M>
  propertyType: FieldTypeFor<K, M>
}

export interface FilterCondition {
  property: string
  operator: string
  value: any
  propertyType?: string
}

export interface QueryResult<T extends DatabaseRecord> {
  results: T[]
  hasMore: boolean
  nextCursor: string | null
}

export class QueryBuilder<
  T extends DatabaseRecord,
  M extends DatabaseFieldMetadata = {}
> implements PromiseLike<T[] | T | null>
{
  private client: Client
  private databaseId: string
  private fieldTypes: M
  private filterConditions: FilterCondition[] = []
  private logicalOperator: LogicalOperator = "and"
  private nestedFilters: any[] = []
  private sortOptions: QueryDatabaseParameters["sorts"] = []
  private pageLimit: number = 100
  private startCursor?: string
  private singleMode: "required" | "optional" | null = null
  private fileManager?: FileManager

  constructor(
    client: Client,
    databaseId: string,
    fieldTypes: M = {} as M,
    fileManager?: FileManager
  ) {
    this.client = client
    this.databaseId = databaseId
    this.fieldTypes = fieldTypes
    this.fileManager = fileManager
    // no DatabaseService import to avoid cycles
  }

  filter<K extends keyof M & keyof T & string, O extends OperatorsFor<K, M>>(
    property: K,
    operator: O,
    value: ValueTypeFor<K, M, O>
  ): QueryBuilder<T, M> {
    if (!this.isValidOperatorForField(property, operator as string)) {
      throw new Error(
        `Invalid operator "${operator}" for field "${property}" of type "${this.getFieldTypeForFilter(
          property
        )}"`
      )
    }

    const fieldType = this.getFieldTypeForFilter(property)
    const propertyType = this.mapFieldTypeToNotionProperty(fieldType)

    this.filterConditions.push({
      property: property as string,
      operator: operator as string,
      value: this.prepareFilterValue(fieldType, operator as string, value),
      propertyType
    })

    return this
  }

  private mapFieldTypeToNotionProperty(
    fieldType: NotionFieldType | undefined
  ): string {
    if (!fieldType) return "rich_text"
    switch (fieldType) {
      case "title":
        return "title"
      case "rich_text":
        return "rich_text"
      case "number":
        return "number"
      case "select":
        return "select"
      case "multi_select":
        return "multi_select"
      case "date":
      case "created_time":
      case "last_edited_time":
        return "date"
      case "checkbox":
        return "checkbox"
      case "people":
      case "created_by":
      case "last_edited_by":
        return "people"
      case "files":
        return "files"
      case "url":
        return "url"
      case "email":
        return "email"
      case "phone_number":
        return "phone_number"
      case "relation":
        return "relation"
      case "formula":
        return "formula"
      case "rollup":
        return "rollup"
      case "status":
        return "status"
      case "unique_id":
        return "unique_id"
      default:
        return "rich_text"
    }
  }

  private prepareFilterValue(
    fieldType: NotionFieldType | undefined,
    operator: string,
    value: any
  ): any {
    if (operator === "is_empty" || operator === "is_not_empty") {
      return true
    }
    if (
      fieldType === "date" ||
      fieldType === "created_time" ||
      fieldType === "last_edited_time"
    ) {
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    }
    if (
      fieldType === "multi_select" &&
      (operator === "contains" || operator === "does_not_contain")
    ) {
      if (Array.isArray(value)) {
        return value[0] || ""
      }
      return value
    }
    return value
  }

  sort(
    property: keyof M & keyof T & string,
    direction: SortDirection = "ascending"
  ): QueryBuilder<T, M> {
    if (!this.isValidSortField(property)) {
      throw new Error(
        `Invalid sort property "${property}". Property not found in database schema. Available fields: ${Object.keys(
          this.fieldTypes
        ).join(", ")}`
      )
    }
    if (direction !== "ascending" && direction !== "descending") {
      throw new Error(
        `Invalid sort direction "${direction}". Must be "ascending" or "descending".`
      )
    }
    debug.log(`Adding sort: ${property} ${direction}`)
    ;(this.sortOptions as any[]).push({ property, direction })
    return this
  }

  limit(limit: number): QueryBuilder<T, M> {
    this.pageLimit = limit
    return this
  }

  startAfter(cursor: string): QueryBuilder<T, M> {
    this.startCursor = cursor
    return this
  }

  single(): QueryBuilder<T, M> {
    this.singleMode = "required"
    this.pageLimit = 2
    return this
  }

  maybeSingle(): QueryBuilder<T, M> {
    this.singleMode = "optional"
    this.pageLimit = 1
    return this
  }

  then<TResult1 = T[] | T | null, TResult2 = never>(
    onfulfilled?:
      | ((value: T[] | T | null) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<T[] | T | null> {
    const { results } = await this.paginate(this.pageLimit)
    if (this.singleMode === "required") {
      if (results.length === 0) {
        throw new Error("No records found matching the query")
      }
      if (results.length > 1) {
        throw new Error("Multiple records found when expecting exactly one")
      }
      return results[0]
    }
    if (this.singleMode === "optional") {
      return results.length > 0 ? results[0] : null
    }
    return results
  }

  async paginate(pageSize: number = 100): Promise<QueryResult<T>> {
    const filter = this.buildFilter()
    try {
      debug.query(this.databaseId, {
        database_id: this.databaseId,
        filter: filter || undefined,
        sorts: this.sortOptions,
        page_size: pageSize,
        start_cursor: this.startCursor
      })

      const response = await this.client.databases.query({
        database_id: this.databaseId,
        filter: filter || undefined,
        sorts:
          this.sortOptions && this.sortOptions.length > 0
            ? this.sortOptions
            : undefined,
        page_size: pageSize,
        start_cursor: this.startCursor
      })

      debug.log(`Query returned ${response.results.length} results`)

      const pages = response.results as PageObjectResponse[]

      debug.log(`[QueryBuilder] FileManager present:`, !!this.fileManager)
      debug.log(
        `[QueryBuilder] Cache enabled:`,
        this.fileManager?.isCacheEnabled()
      )
      debug.log(
        `[QueryBuilder] Using unified processing with ${pages.length} pages`
      )
      const results: T[] = await Promise.all(
        pages.map(async (page) => {
          const simple: Record<string, any> = { id: page.id }
          const advanced: Record<string, any> = { id: page.id }
          for (const [key, value] of Object.entries(page.properties)) {
            simple[key] = await getPropertyValueSimple(
              value as any,
              this.fileManager || new FileManager({} as any)
            )
            advanced[key] = await getPropertyValueAdvanced(
              value as any,
              this.fileManager || new FileManager({} as any)
            )
          }
          return {
            id: page.id,
            ...simple,
            advanced: { id: page.id, ...advanced },
            raw: { id: page.id, properties: page.properties }
          } as T
        })
      )
      debug.log(
        `[QueryBuilder] Processed ${results.length} records with unified processing`
      )

      return {
        results,
        hasMore: response.has_more,
        nextCursor: response.next_cursor
      }
    } catch (error) {
      debug.error(error, {
        databaseId: this.databaseId,
        filter,
        sorts: this.sortOptions,
        pageSize,
        startCursor: this.startCursor
      })
      throw error
    }
  }

  async all(): Promise<T[]> {
    let allResults: T[] = []
    let hasMore = true
    let cursor: string | null = null
    while (hasMore) {
      if (cursor) {
        this.startAfter(cursor)
      }
      const response = await this.paginate(100)
      allResults = [...allResults, ...response.results]
      hasMore = response.hasMore
      cursor = response.nextCursor
    }
    return allResults
  }

  private buildFilter(): any {
    const filters: any[] = []
    this.filterConditions.forEach((condition) => {
      const { property, operator, value, propertyType } = condition
      const filter: any = { property }
      if (!propertyType) {
        throw new Error(
          `Property type not determined for property: ${String(property)}`
        )
      }
      const notionOperator = this.mapToNotionOperator(operator)
      filter[propertyType] = { [notionOperator]: value }
      filters.push(filter)
    })
    filters.push(...this.nestedFilters)
    if (filters.length === 0) return undefined
    if (filters.length === 1) return filters[0]
    return { [this.logicalOperator]: filters }
  }

  private mapToNotionOperator(operator: string): string {
    switch (operator) {
      case "equals":
      case "does_not_equal":
      case "contains":
      case "does_not_contain":
      case "starts_with":
      case "ends_with":
      case "greater_than":
      case "less_than":
      case "greater_than_or_equal_to":
      case "less_than_or_equal_to":
      case "before":
      case "after":
      case "on_or_before":
      case "on_or_after":
      case "is_empty":
      case "is_not_empty":
        return operator
      default:
        return operator
    }
  }

  getFieldTypeForFilter(
    property: keyof T & string
  ): NotionFieldType | undefined {
    const metadata = this.fieldTypes[property as keyof M]
    return metadata?.type
  }

  isValidOperatorForField<K extends keyof M>(
    property: K,
    operator: string
  ): operator is OperatorsFor<K, M> {
    const fieldType = this.getFieldTypeForFilter(property as keyof T & string)
    if (!fieldType || !(fieldType in OPERATOR_MAP)) {
      return false
    }
    const validOperators = OPERATOR_MAP[fieldType as keyof typeof OPERATOR_MAP]
    return validOperators.includes(operator)
  }

  private isValidSortField(property: keyof M & string): boolean {
    const fieldType = this.getFieldTypeForFilter(property)
    return fieldType !== undefined
  }
}
