import { Client } from "@notionhq/client";
import {
  NotionPropertyType,
  AdvancedDatabaseRecord,
  DatabaseRecord,
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
// Use the public API methods like query(), getRecord(), and getAllDatabaseRecords() for database operations
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
  private contentConverter: ContentConverter;
  private blockProcessor: BlockProcessor;
  private pageContentService: PageContentService;
  private databaseService: DatabaseService;

  constructor(token: string, config?: NotionCMSConfig) {
    this.client = new Client({ auth: token });
    this.config = mergeConfig(config);
    this.fileManager = new FileManager(this.config);
    // Initialize services
    this.contentConverter = new ContentConverter();
    this.blockProcessor = new BlockProcessor(this.fileManager);
    this.pageContentService = new PageContentService(
      this.client,
      this.blockProcessor
    );
    this.databaseService = new DatabaseService(this.client, this.fileManager);
  }

  // UTILITY METHODS

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

  // HIGH-LEVEL PUBLIC API

  /**
   * Creates a query builder for a Notion database with type safety
   * This is the recommended way to interact with databases
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
   * Get a single record from a database by its ID
   * Record includes all access levels: simple, advanced, and raw
   * @param pageId The ID of the Notion page/record
   * @returns A promise that resolves to the record
   */
  async getRecord<T extends DatabaseRecord>(pageId: string): Promise<T> {
    return this.databaseService.getRecord<T>(pageId);
  }

  /**
   * Get all records from a database with automatic pagination
   * Records include all access levels: simple, advanced, and raw
   * @param databaseId The ID of the Notion database
   * @param options Query options for filtering and sorting
   * @returns A promise that resolves to all records from the database
   */
  async getAllDatabaseRecords<T extends DatabaseRecord>(
    databaseId: string,
    options: Omit<QueryOptions, "startCursor" | "pageSize"> = {}
  ): Promise<T[]> {
    return this.databaseService.getAllDatabaseRecords<T>(databaseId, options);
  }

  /**
   * Retrieve the content blocks of a Notion page
   * @param pageId The ID of the Notion page
   * @param recursive Whether to recursively fetch nested blocks (default: true)
   * @returns A promise that resolves to an array of simplified blocks
   */
  async getPageContent(
    pageId: string,
    recursive: boolean = true
  ): Promise<SimpleBlock[]> {
    return this.pageContentService.getPageContent(pageId, recursive);
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
