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
import { NotionProperty } from "./utils/property-helpers";
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
import { DatabaseService, QueryOptions } from "./database-service";

// Note: Property utility functions have been consolidated into DatabaseService
// Use DatabaseService.getRecord() or DatabaseService.getDatabase() for full functionality
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

export class NotionCMS {
  private client: Client;
  private config: Required<NotionCMSConfig>;
  private fileManager: FileManager;
  private autoProcessFiles: boolean;
  private contentConverter: ContentConverter;
  private blockProcessor: BlockProcessor;
  private pageContentService: PageContentService;
  private databaseService: DatabaseService;

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
    this.databaseService = new DatabaseService(
      this.client,
      this.fileManager,
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
    return this.databaseService.query<T, M>(databaseId, fieldMetadata);
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
    return this.databaseService.getDatabase<T>(databaseId, options);
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
    return this.databaseService.getRecord<T>(pageId, options);
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
    return this.databaseService.getAllDatabaseRecords<T>(databaseId, options);
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
    return this.databaseService.createFilter(property, type, value);
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
}

// Re-export types and utilities from ContentConverter, BlockProcessor, PageContentService, and DatabaseService
export { ContentConverter } from "./converter";
export { BlockProcessor } from "./processor";
export { PageContentService } from "./page-content-service";
export { DatabaseService } from "./database-service";
export type { QueryOptions } from "./database-service";

// Re-export types and utilities
export * from "./generator";
