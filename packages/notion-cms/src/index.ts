import { Client } from "@notionhq/client"
import type { ContentBlockRaw } from "./types/content-types"
import type { RawHtmlOptions } from "./content/block-content-converter/converter-raw-html"
import { NotionPropertyType } from "./generator"
import type { DatabaseRecordType } from "./generator"
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
  TypeSafeFilterCondition
} from "./database/query-builder"

import { NotionProperty } from "./utils/property-helpers"
import { NotionCMSConfig, mergeConfig } from "./config"
import { FileManager } from "./file-processor/file-manager"
import {
  ContentConverter,
  SimpleBlock,
  TableBlockContent,
  TableRowCell,
  TableRowBlockContent,
  SimpleTableBlock,
  SimpleTableRowBlock
} from "./content/content-converter"
import { BlockProcessor } from "./content/processor"
import { PageContentService } from "./content/page-content-service"
import { ContentProcessor } from "./content/content-processor"
import { DatabaseService } from "./database/database-service"
import { debug } from "./utils/debug"
export type {
  ContentBlockAdvanced,
  ContentTableRowAdvanced,
  ContentBlockRaw
} from "./types/content-types"

// Note: Property utility functions have been consolidated into DatabaseService
// Use the public API methods like query(), getRecord(), and getAllDatabaseRecords() for database operations
export type {
  /** @experimental */ SimpleBlock,
  TableBlockContent,
  TableRowCell,
  TableRowBlockContent,
  SimpleTableBlock,
  SimpleTableRowBlock,
  NotionCMSConfig
}

// Re-export query-builder types and values
export { QueryBuilder, OPERATOR_MAP }
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
  TypeSafeFilterCondition
}

// Database Registry Interface - extended by generated types
export interface DatabaseRegistry {
  // This will be extended by generated database-specific types
  // Each database will add a key like:
  // productCatalog: { record: RecordProductCatalog; fields: typeof RecordProductCatalogFieldTypes; }
}

export type { NotionPropertyType, NotionProperty }

export class NotionCMS {
  private client: Client
  private config: Required<NotionCMSConfig>
  private fileManager: FileManager
  private contentConverter: ContentConverter
  private blockProcessor: BlockProcessor
  private pageContentService: PageContentService
  private databaseService: DatabaseService
  private contentProcessor: ContentProcessor

  /**
   * Initialize the NotionCMS instance
   * @param {string} token The Notion API token
   * @param {NotionCMSConfig} [config] configuration object
   */
  constructor(token: string, config?: NotionCMSConfig) {
    this.client = new Client({ auth: token })
    this.config = mergeConfig(config)

    // Configure debug logger with the merged config
    debug.configure(this.config.debug)

    this.fileManager = new FileManager(this.config)
    // Initialize services
    this.contentConverter = new ContentConverter()
    this.blockProcessor = new BlockProcessor(this.fileManager)
    this.pageContentService = new PageContentService(
      this.client,
      this.blockProcessor
    )
    this.databaseService = new DatabaseService(this.client, this.fileManager)
    this.contentProcessor = new ContentProcessor(this.pageContentService)
  }

  // UTILITY METHODS

  /**
   * Convert page content to Markdown
   * @param blocks Array of blocks to convert
   * @returns Markdown string
   */
  public blocksToMarkdown(
    blocks: ContentBlockRaw[],
    options?: {
      listIndent?: string
      debug?: boolean
    }
  ): string {
    return this.contentConverter.blocksToMarkdown(blocks, options)
  }

  /**
   * Convert page content to HTML
   * @param blocks Array of blocks to convert
   * @returns HTML string
   */
  public blocksToHtml(
    blocks: ContentBlockRaw[],
    options?: RawHtmlOptions
  ): string {
    return this.contentConverter.blocksToHtml(blocks, options)
  }

  // HIGH-LEVEL PUBLIC API

  /**
   * Creates a query builder for a Notion database with type safety using semantic database keys
   * This is the recommended way to interact with databases
   * @param databaseKey The semantic key for the database (e.g., "productCatalog", "blogPosts")
   * @returns A type-safe QueryBuilder for the specified database
   */
  query<K extends keyof DatabaseRegistry>(
    databaseKey: K
  ): QueryBuilder<DatabaseRegistry[K]["record"], DatabaseRegistry[K]["fields"]>
  query<K extends keyof DatabaseRegistry, V extends DatabaseRecordType>(
    databaseKey: K,
    options: { recordType: V }
  ): QueryBuilder<
    V extends "simple"
      ? DatabaseRegistry[K]["record"]
      : V extends "advanced"
      ? DatabaseRegistry[K]["recordAdvanced"]
      : DatabaseRegistry[K]["recordRaw"],
    DatabaseRegistry[K]["fields"]
  >
  query<K extends keyof DatabaseRegistry>(
    databaseKey: K,
    options?: { recordType?: DatabaseRecordType }
  ): QueryBuilder<any, DatabaseRegistry[K]["fields"]> {
    const databaseConfig = (this as any).databases?.[databaseKey]
    if (!databaseConfig) {
      throw new Error(
        `Database "${String(
          databaseKey
        )}" not found in registry. Make sure you've imported the generated types file.`
      )
    }
    return this._query(databaseConfig.id, databaseConfig.fields, {
      recordType: options?.recordType || "simple"
    })
  }

  /**
   * Creates a query builder for a Notion database using direct database ID
   * Use this for testing or when you don't have generated types
   * @param databaseId The ID of the Notion database
   * @param fieldMetadata Optional metadata about field types for type-safe operations
   * @returns A query builder instance for the specified database
   */
  queryDatabase<T = any, M extends DatabaseFieldMetadata = {}>(
    databaseId: string,
    fieldMetadata?: M
  ): QueryBuilder<T, M>
  queryDatabase<
    T = any,
    M extends DatabaseFieldMetadata = {},
    V extends DatabaseRecordType = "simple"
  >(
    databaseId: string,
    fieldMetadata: M | undefined,
    options: { recordType: V }
  ): QueryBuilder<T, M>
  queryDatabase<T = any, M extends DatabaseFieldMetadata = {}>(
    databaseId: string,
    fieldMetadata?: M,
    options?: { recordType?: DatabaseRecordType }
  ): QueryBuilder<T, M> {
    return this._query<T, M>(databaseId, fieldMetadata, options)
  }

  /**
   * Internal query method for direct database access
   * @param databaseId The ID of the Notion database
   * @param fieldMetadata Optional metadata about field types for type-safe operations
   * @returns A query builder instance for the specified database
   * @private
   */
  private _query<T = any, M extends DatabaseFieldMetadata = {}>(
    databaseId: string,
    fieldMetadata?: M,
    options?: { recordType?: DatabaseRecordType }
  ): QueryBuilder<T, M> {
    return this.databaseService.query<T, M>(databaseId, fieldMetadata, options)
  }

  /**
   * Get a single record from a database by its ID
   * @param pageId The ID of the Notion page/record
   * @returns A promise that resolves to the record in the selected view (default simple)
   */
  async getRecord<T = any>(pageId: string): Promise<T>
  async getRecord<T = any>(
    pageId: string,
    options: { recordType: "simple" }
  ): Promise<T>
  async getRecord<T = any>(
    pageId: string,
    options: { recordType: "advanced" }
  ): Promise<T>
  async getRecord<T = any>(
    pageId: string,
    options: { recordType: "raw" }
  ): Promise<T>
  async getRecord<T = any>(
    pageId: string,
    options?: { recordType?: DatabaseRecordType }
  ): Promise<T> {
    return this.databaseService.getRecord<T>(pageId, {
      recordType: options?.recordType || "simple"
    })
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
    return this.pageContentService.getPageContent(pageId, recursive)
  }

  /**
   * Retrieve raw content blocks for a Notion page
   * @param pageId The ID of the Notion page
   * @param recursive Whether to recursively fetch nested blocks (default: true)
   */
  async getPageContentRaw(pageId: string, recursive: boolean = true) {
    return this.pageContentService.getPageContentRaw(pageId, recursive)
  }

  /**
   * Retrieve advanced content blocks for a Notion page
   */
  async getPageContentAdvanced(pageId: string, recursive: boolean = true) {
    return this.contentProcessor.getAdvancedBlocks(
      pageId,
      recursive,
      async (_block, field) => {
        if (!field) return ""
        const src =
          field?.type === "external" ? field?.external?.url : field?.file?.url
        try {
          return await this.fileManager.processFileUrl(
            src || "",
            `content-block-${_block.id}`
          )
        } catch {
          return src || ""
        }
      }
    )
  }
}

// Re-export types and utilities from ContentConverter, BlockProcessor, PageContentService, and DatabaseService
export { ContentConverter } from "./content/content-converter"
export { BlockProcessor } from "./content/processor"
export { PageContentService } from "./content/page-content-service"
export { ContentProcessor } from "./content/content-processor"
export { DatabaseService } from "./database/database-service"
export type { QueryOptions, RecordOptions } from "./database/database-service"
export { richTextToPlain, richTextToMarkdown } from "./utils/rich-text"
export { richTextToHtml } from "./utils/rich-text"
export {
  groupConsecutiveListItems,
  mapRawBlocksWithDepth,
  walkRawBlocks
} from "./utils/block-traversal"
export { blocksToMarkdown } from "./content/block-content-converter/converter-raw-markdown"
export { blocksToHtml } from "./content/block-content-converter/converter-raw-html"

// Re-export types and utilities
export * from "./generator"
