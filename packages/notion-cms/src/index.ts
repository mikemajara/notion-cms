import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  PropertyItemObjectResponse,
  QueryDatabaseParameters,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {
  NotionPropertyType,
  AdvancedDatabaseRecord,
  DatabaseRecord,
  processNotionRecord,
  processNotionRecords,
} from "./generator";
import {
  QueryBuilder,
  SortDirection,
  LogicalOperator,
  FilterCondition,
  QueryResult,
  NotionFieldType,
  DatabaseFieldMetadata,
  OperatorMap,
  OPERATOR_MAP,
  FieldTypeFor,
  OperatorsFor,
  SelectOptionsFor,
  ValueTypeFor,
  ValueTypeMap,
  TypeSafeFilterCondition,
} from "./query-builder";
import { debug } from "./utils/debug";
import {
  NotionProperty,
  getPropertyValue,
  simplifyNotionRecord,
  simplifyNotionRecords,
  createSimplifyFunction,
  createSimplifyRecordsFunction,
} from "./utils/property-helpers";
import { NotionCMSConfig, mergeConfig } from "./config";
import { FileManager } from "./file-manager";
import {
  ContentConverter,
  SimpleBlock,
  TableBlockContent,
  TableRowCell,
  TableRowBlockContent,
  SimpleTableBlock,
  SimpleTableRowBlock,
} from "./converter";
import { BlockProcessor } from "./processor";
import { PageContentService } from "./page-content-service";

// Re-export utility functions and types for use in projects
export {
  getPropertyValue,
  simplifyNotionRecord,
  simplifyNotionRecords,
  createSimplifyFunction,
  createSimplifyRecordsFunction,
};
export type {
  DatabaseRecord,
  SimpleBlock,
  TableBlockContent,
  TableRowCell,
  TableRowBlockContent,
  SimpleTableBlock,
  SimpleTableRowBlock,
  NotionCMSConfig,
};

// Re-export query-builder types and values
export { QueryBuilder, OPERATOR_MAP };
export type {
  SortDirection,
  LogicalOperator,
  FilterCondition,
  QueryResult,
  NotionFieldType,
  DatabaseFieldMetadata,
  OperatorMap,
  FieldTypeFor,
  OperatorsFor,
  SelectOptionsFor,
  ValueTypeFor,
  ValueTypeMap,
  TypeSafeFilterCondition,
};

export type { NotionPropertyType, NotionProperty };

export interface QueryOptions {
  filter?: QueryDatabaseParameters["filter"];
  sorts?: QueryDatabaseParameters["sorts"];
  pageSize?: number;
  startCursor?: string;
}

export class NotionCMS {
  private client: Client;
  private config: Required<NotionCMSConfig>;
  private fileManager: FileManager;
  private autoProcessFiles: boolean;
  private contentConverter: ContentConverter;
  private blockProcessor: BlockProcessor;
  private pageContentService: PageContentService;

  constructor(token: string, config?: NotionCMSConfig) {
    this.client = new Client({ auth: token });
    this.config = mergeConfig(config);
    this.fileManager = new FileManager(this.config);
    // Auto-enable file processing if cache strategy is configured
    this.autoProcessFiles = this.config.files?.strategy === "cache";
    // Initialize services
    this.contentConverter = new ContentConverter();
    this.blockProcessor = new BlockProcessor(this.fileManager);
    this.pageContentService = new PageContentService(
      this.client,
      this.blockProcessor,
      this.autoProcessFiles
    );
  }

  /**
   * Convert page content to Markdown
   * @param blocks Array of blocks to convert
   * @returns Markdown string
   */
  public blocksToMarkdown(blocks: SimpleBlock[]): string {
    return this.contentConverter.blocksToMarkdown(blocks);
  }

  /**
   * Convert page content to HTML
   * @param blocks Array of blocks to convert
   * @returns HTML string
   */
  public blocksToHtml(blocks: SimpleBlock[]): string {
    return this.contentConverter.blocksToHtml(blocks);
  }

  /**
   * Creates a query builder for a Notion database with type safety
   * @param databaseId The ID of the Notion database
   * @param fieldMetadata Optional metadata about field types for type-safe operations
   * @returns A query builder instance for the specified database
   */
  query<T extends DatabaseRecord, M extends DatabaseFieldMetadata = {}>(
    databaseId: string,
    fieldMetadata?: M
  ): QueryBuilder<T, M> {
    if (fieldMetadata) {
      return new QueryBuilder<T, M>(
        this.client,
        databaseId,
        fieldMetadata,
        this.fileManager
      );
    } else {
      return new QueryBuilder<T, M>(
        this.client,
        databaseId,
        {} as M,
        this.fileManager
      );
    }
  }

  /**
   * Get all records from a Notion database with pagination, filtering, and sorting
   * Records include all access levels: simple, advanced, and raw
   * @param databaseId The ID of the Notion database
   * @param options Query options for filtering, sorting, and pagination, plus file processing
   * @returns A promise that resolves to an array of records with pagination metadata
   */
  async getDatabase<T extends DatabaseRecord>(
    databaseId: string,
    options: QueryOptions & { processFiles?: boolean } = {}
  ): Promise<{ results: T[]; nextCursor: string | null; hasMore: boolean }> {
    try {
      const { processFiles, ...queryOptions } = options;
      const shouldProcessFiles = processFiles ?? this.autoProcessFiles;

      debug.query(databaseId, {
        database_id: databaseId,
        filter: queryOptions.filter,
        sorts: queryOptions.sorts,
        page_size: queryOptions.pageSize,
        start_cursor: queryOptions.startCursor,
      });

      const response = await this.client.databases.query({
        database_id: databaseId,
        filter: queryOptions.filter,
        sorts: queryOptions.sorts,
        page_size: queryOptions.pageSize,
        start_cursor: queryOptions.startCursor,
      });

      debug.log(`Query returned ${response.results.length} results`);

      const pages = response.results as PageObjectResponse[];

      // Use unified async processing for all records
      const results = (await this.processNotionRecordsUnified(
        pages,
        shouldProcessFiles
      )) as T[];

      return {
        results,
        nextCursor: response.next_cursor,
        hasMore: response.has_more,
      };
    } catch (error) {
      debug.error(error, {
        databaseId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get a single record from a database by its ID
   * Record includes all access levels: simple, advanced, and raw
   * @param pageId The ID of the Notion page/record
   * @param options Optional configuration including file processing
   * @returns A promise that resolves to the record
   */
  async getRecord<T extends DatabaseRecord>(
    pageId: string,
    options: { processFiles?: boolean } = {}
  ): Promise<T> {
    const page = (await this.client.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;

    const shouldProcessFiles = options.processFiles ?? this.autoProcessFiles;

    // Use unified async processing
    return (await this.processNotionRecordUnified(
      page,
      shouldProcessFiles
    )) as T;
  }

  /**
   * Get all records from a database with automatic pagination
   * Records include all access levels: simple, advanced, and raw
   * @param databaseId The ID of the Notion database
   * @param options Query options for filtering and sorting, plus file processing
   * @returns A promise that resolves to all records from the database
   */
  async getAllDatabaseRecords<T extends DatabaseRecord>(
    databaseId: string,
    options: Omit<QueryOptions, "startCursor" | "pageSize"> & {
      processFiles?: boolean;
    } = {}
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
   * @deprecated This method uses old filter patterns. Use the new QueryBuilder.filter(property, operator, value) method instead.
   * The new method provides type-safe field names, operators, and values with IntelliSense support.
   */
  createFilter(
    property: string,
    type: string,
    value: any
  ): QueryDatabaseParameters["filter"] {
    console.warn(
      "createFilter() is deprecated. Use the new type-safe filter method: queryBuilder.filter(property, operator, value)"
    );

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

  /**
   * Retrieve the content blocks of a Notion page
   * @param pageId The ID of the Notion page
   * @param recursive Whether to recursively fetch nested blocks (default: true)
   * @param options Optional configuration including file processing
   * @returns A promise that resolves to an array of simplified blocks
   */
  async getPageContent(
    pageId: string,
    recursive: boolean = true,
    options: { processFiles?: boolean } = {}
  ): Promise<SimpleBlock[]> {
    return this.pageContentService.getPageContent(pageId, recursive, options);
  }

  /**
   * Unified processing function for Notion records with optional file processing
   * @param page The Notion page object from the API
   * @param processFiles Whether to process files through FileManager
   * @returns A processed record with simple, advanced, and raw access
   */
  private async processNotionRecordUnified(
    page: PageObjectResponse,
    processFiles: boolean = false
  ): Promise<DatabaseRecord> {
    if (processFiles && this.fileManager?.isCacheEnabled()) {
      // Use async processing when file caching is enabled
      return this.processNotionRecordWithFiles(page);
    } else {
      // Use sync processing for compatibility
      return processNotionRecord(page, this.fileManager);
    }
  }

  /**
   * Unified processing function for multiple Notion records with optional file processing
   * @param pages An array of Notion page objects
   * @param processFiles Whether to process files through FileManager
   * @returns An array of processed records with layered access
   */
  private async processNotionRecordsUnified(
    pages: PageObjectResponse[],
    processFiles: boolean = false
  ): Promise<DatabaseRecord[]> {
    if (processFiles && this.fileManager?.isCacheEnabled()) {
      // Use async processing when file caching is enabled
      return Promise.all(
        pages.map((page) => this.processNotionRecordWithFiles(page))
      );
    } else {
      // Use sync processing for compatibility
      return processNotionRecords(pages, this.fileManager);
    }
  }

  /**
   * Process a Notion page into a record with file processing
   * @param page The Notion page object from the API
   * @returns A processed record with file processing applied
   */
  private async processNotionRecordWithFiles(
    page: PageObjectResponse
  ): Promise<DatabaseRecord> {
    // Simple values (base level access)
    const simple: Record<string, any> = {
      id: page.id,
    };

    // More detailed but still processed values
    const advanced: Record<string, any> = {
      id: page.id,
    };

    // Process each property with async file processing
    for (const [key, value] of Object.entries(page.properties)) {
      // Simple version (direct access)
      simple[key] = await this.getPropertyValueUnified(
        value as PropertyItemObjectResponse,
        true
      );

      // Advanced version (detailed access)
      advanced[key] = await this.getAdvancedPropertyValueUnified(
        value as PropertyItemObjectResponse,
        true
      );
    }

    // Construct unified record with all three access levels
    const result: DatabaseRecord = {
      id: page.id,
      ...simple,
      advanced: {
        id: page.id,
        ...advanced,
      },
      raw: {
        id: page.id,
        properties: page.properties,
      },
    };

    return result;
  }

  /**
   * Unified property value extraction with optional file processing
   * @param property Property item from Notion API
   * @param processFiles Whether to process files through FileManager
   * @returns Processed property value
   */
  private async getPropertyValueUnified(
    property: PropertyItemObjectResponse,
    processFiles: boolean = false
  ): Promise<any> {
    // For files property, handle async processing if needed
    if (
      property.type === "files" &&
      processFiles &&
      this.fileManager?.isCacheEnabled()
    ) {
      const filesProp = property as any;
      const files = filesProp.files.map((file: any) => ({
        name: file.name,
        url: file.type === "external" ? file.external.url : file.file.url,
      }));

      // Process files through the FileManager for caching
      const processedFiles = await Promise.all(
        files.map(async (file: any) => {
          const processedUrl = await this.fileManager.processFileUrl(
            file.url,
            file.name
          );
          return {
            ...file,
            url: processedUrl,
          };
        })
      );
      return processedFiles;
    }

    // For all other properties, use the existing sync function
    // Import the function from generator.ts to avoid duplication
    const { getPropertyValue } = await import("./generator");
    return getPropertyValue(property, this.fileManager);
  }

  /**
   * Unified advanced property value extraction with optional file processing
   * @param property Property item from Notion API
   * @param processFiles Whether to process files through FileManager
   * @returns Processed advanced property value
   */
  private async getAdvancedPropertyValueUnified(
    property: PropertyItemObjectResponse,
    processFiles: boolean = false
  ): Promise<any> {
    // For files property, handle async processing if needed
    if (
      property.type === "files" &&
      processFiles &&
      this.fileManager?.isCacheEnabled()
    ) {
      const filesProp = property as any;
      const files = filesProp.files.map((file: any) => ({
        name: file.name,
        type: file.type,
        ...(file.type === "external" && {
          external: {
            url: file.external.url,
          },
        }),
        ...(file.type === "file" && {
          file: {
            url: file.file.url,
            expiry_time: file.file.expiry_time,
          },
        }),
      }));

      // Process files through the FileManager for caching
      const processedFiles = await Promise.all(
        files.map(async (file: any) => {
          const originalUrl =
            file.type === "external" ? file.external?.url : file.file?.url;
          if (originalUrl) {
            const processedUrl = await this.fileManager.processFileUrl(
              originalUrl,
              file.name
            );

            // Update the URL in the appropriate location
            if (file.type === "external" && file.external) {
              file.external.url = processedUrl;
            } else if (file.type === "file" && file.file) {
              file.file.url = processedUrl;
            }
          }
          return file;
        })
      );
      return processedFiles;
    }

    // For all other properties, use the existing sync function
    // Import the function from generator.ts to avoid duplication
    const { getAdvancedPropertyValue } = await import("./generator");
    return getAdvancedPropertyValue(property, this.fileManager);
  }
}

// Re-export types and utilities from ContentConverter, BlockProcessor, and PageContentService
export { ContentConverter } from "./converter";
export { BlockProcessor } from "./processor";
export { PageContentService } from "./page-content-service";

// Re-export types and utilities
export * from "./generator";
