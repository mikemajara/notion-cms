import { Client } from "@notionhq/client";
import {
  DatabaseObjectResponse,
  PageObjectResponse,
  PropertyItemObjectResponse,
  QueryDatabaseParameters,
  GetPageResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {
  getPropertyValue,
  NotionPropertyType,
  simplifyNotionRecord,
  simplifyNotionRecords,
  DatabaseRecord,
} from "./generator";

export interface QueryOptions {
  filter?: QueryDatabaseParameters["filter"];
  sorts?: QueryDatabaseParameters["sorts"];
  pageSize?: number;
  startCursor?: string;
}

export class NotionCMS {
  private client: Client;

  constructor(token: string) {
    this.client = new Client({ auth: token });
  }

  /**
   * Get all records from a Notion database with pagination, filtering, and sorting
   * @param databaseId The ID of the Notion database
   * @param options Query options for filtering, sorting, and pagination
   * @returns A promise that resolves to an array of records with pagination metadata
   */
  async getDatabase<T extends DatabaseRecord>(
    databaseId: string,
    options: QueryOptions = {}
  ): Promise<{ results: T[]; nextCursor: string | null; hasMore: boolean }> {
    const response = await this.client.databases.query({
      database_id: databaseId,
      filter: options.filter,
      sorts: options.sorts,
      page_size: options.pageSize,
      start_cursor: options.startCursor,
    });

    // Use the simplifyNotionRecords utility instead of manual mapping
    const pages = response.results as PageObjectResponse[];
    const results = simplifyNotionRecords(pages) as T[];

    return {
      results,
      nextCursor: response.next_cursor,
      hasMore: response.has_more,
    };
  }

  /**
   * Get a single record from a database by its ID
   * @param pageId The ID of the Notion page/record
   * @returns A promise that resolves to the record
   */
  async getRecord<T extends DatabaseRecord>(pageId: string): Promise<T> {
    const page = (await this.client.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;

    // Use the simplifyNotionRecord utility for better type safety
    return simplifyNotionRecord(page) as T;
  }

  /**
   * Get all records from a database with automatic pagination
   * @param databaseId The ID of the Notion database
   * @param options Query options for filtering and sorting
   * @returns A promise that resolves to all records from the database
   */
  async getAllDatabaseRecords<T extends DatabaseRecord>(
    databaseId: string,
    options: Omit<QueryOptions, "startCursor" | "pageSize"> = {}
  ): Promise<T[]> {
    const results: T[] = [];
    let hasMore = true;
    let startCursor: string | null = null;

    while (hasMore) {
      const response: {
        results: T[];
        nextCursor: string | null;
        hasMore: boolean;
      } = await this.getDatabase<T>(databaseId, {
        ...options,
        startCursor: startCursor || undefined,
      });

      results.push(...response.results);
      hasMore = response.hasMore;
      startCursor = response.nextCursor;
    }

    return results;
  }

  /**
   * Create a typed filter for a database query
   * @param property The property name to filter on
   * @param type The type of filter to apply
   * @param value The filter value
   * @returns A properly formatted filter object
   */
  createFilter(
    property: string,
    type: string,
    value: any
  ): QueryDatabaseParameters["filter"] {
    const filter: any = {
      property: property,
    };

    switch (type) {
      case "equals":
        filter.equals = value;
        break;
      case "contains":
        filter.contains = value;
        break;
      case "startsWith":
        filter.starts_with = value;
        break;
      case "endsWith":
        filter.ends_with = value;
        break;
      case "greaterThan":
        filter.greater_than = value;
        break;
      case "lessThan":
        filter.less_than = value;
        break;
      case "greaterThanOrEqualTo":
        filter.greater_than_or_equal_to = value;
        break;
      case "lessThanOrEqualTo":
        filter.less_than_or_equal_to = value;
        break;
      case "isEmpty":
        filter.is_empty = true;
        break;
      case "isNotEmpty":
        filter.is_not_empty = true;
        break;
      default:
        throw new Error(`Unknown filter type: ${type}`);
    }

    return filter;
  }
}

// Re-export types and utilities
export * from "./generator";
