import { Client } from "@notionhq/client"
import type {
  ContentBlockAdvanced,
  ContentBlockRaw
} from "./types/content-types"
import type { RawHtmlOptions } from "./content/block-content-converter/converter-raw-html"
import type { NotionPropertyType, DatabaseRecordType } from "./types/public"
import type { RecordGetOptions } from "./database/database-service"
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
import { RawAdvancedOptions } from "./content/block-content-converter/converter-raw-advanced"
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
export type { DatabaseRecord } from "./types/public"

// Shared Content options for all layers
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type ContentOptions = {
  recursive?: boolean
  mediaUrlResolver?: (block: ContentBlockRaw, field: any) => Promise<string>
}

export class NotionCMS {
  private client: Client
  private config: Required<NotionCMSConfig>
  private fileManager: FileManager
  private pageContentService: PageContentService
  private databaseService: DatabaseService
  // TODO: contentConverter has no dependencies on the notion client
  // it may depend on some types from @notionhq/client, which we can import
  // but there's no need to ship it together with the NotionCMS class.
  // private contentConverter: ContentConverter
  // TODO: blockProcessor also has no dependencies on the notion client
  // and is in fact defining methods that could also be part of the converter
  private blockProcessor: BlockProcessor
  // TODO: contentProcessor has no dependencies on the notion client
  // it also is redundant since the only method it exposes is a wrapper
  // around blocksToAdvanced, which can already be used from the converter.
  // private contentProcessor: ContentProcessor
  // Registry populated by generated code (declared for TS)
  public databases!: Record<
    string,
    { id: string; fields: DatabaseFieldMetadata }
  >
  // TODO: Replace any with the correct type
  // which should be a definition of the type that
  // we ultimately generate in generator.ts when
  // we generate all the FieldTypes for each database
  // public databases: Record<string, any> = {}

  static {
    // runs once when the class is defined
    // @ts-ignore
    NotionCMS.prototype.databases = {}
  }

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
    // TODO: remove contentConverter and contentProcessor after migration
    // this.contentConverter = new ContentConverter()
    this.blockProcessor = new BlockProcessor(this.fileManager)
    this.pageContentService = new PageContentService(
      this.client,
      this.blockProcessor
    )
    this.databaseService = new DatabaseService(this.client, this.fileManager)
    // TODO: remove contentProcessor after migration
    // this.contentProcessor = new ContentProcessor(this.pageContentService)
  }

  // UTILITY METHODS

  // TODO: remove blocksToMarkdown after migration
  // this method is only making public the blocksToMarkdown method from the contentConverter
  // from now own we'll create a standalone service called blocksProcessor that will handle the conversion
  // and the raw blocks will be passed to it.

  // /**
  //  * Convert page content to Markdown
  //  * @param blocks Array of blocks to convert
  //  * @returns Markdown string
  //  */
  // public blocksToMarkdown(
  //   blocks: ContentBlockRaw[],
  //   options?: {
  //     listIndent?: string
  //     debug?: boolean
  //   }
  // ): string {
  //   return this.contentConverter.blocksToMarkdown(blocks, options)
  // }

  // TODO: remove blocksToAdvanced after migration

  // /**
  //  * Convert page content to Advanced
  //  * @param blocks Array of blocks to convert
  //  * @param options Options for the conversion
  //  * @returns Advanced content blocks
  //  */
  // public blocksToAdvanced(
  //   blocks: ContentBlockRaw[],
  //   options?: RawAdvancedOptions
  // ): Promise<ContentBlockAdvanced[]> {
  //   const resolver =
  //     options?.mediaUrlResolver ||
  //     (async (_block: ContentBlockRaw, field: any) => {
  //       if (!field) return ""
  //       const src =
  //         field?.type === "external" ? field?.external?.url : field?.file?.url
  //       try {
  //         return await this.fileManager.processFileUrl(
  //           src || "",
  //           `content-block-${_block.id}`
  //         )
  //       } catch {
  //         return src || ""
  //       }
  //     })
  //   return this.contentConverter.blocksToAdvanced(blocks, {
  //     mediaUrlResolver: resolver
  //   })
  // }

  // TODO: remove blocksToHtml after migration

  // /**
  //  * Convert page content to HTML
  //  * @param blocks Array of blocks to convert
  //  * @returns HTML string
  //  */
  // public blocksToHtml(
  //   blocks: ContentBlockRaw[],
  //   options?: RawHtmlOptions
  // ): string {
  //   return this.contentConverter.blocksToHtml(blocks, options)
  // }

  // HIGH-LEVEL PUBLIC API

  // TODO: review which type of block does query return by default.
  // Ideally, and following the previous comments, we should return
  // the Raw blocks by default. and allow an api to turn array's of
  // raw blocks into Simple or Advanced blocks.

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

  // TODO: the methods below retrieve records, but have a critical dependency
  // problem where by the record may be fetched multiple times, once for each layer.
  // This is a performance problem and should be avoided.
  // We should have a single method that fetches the RAW record and leave the conversion
  // to Simple or Advanced blocks to the caller using the methods in our recordProcessor
  // service.

  // /** Returns the Simple layer record. */
  // async getRecordSimple<T = any>(
  //   pageId: string,
  //   options: RecordGetOptions = {}
  // ): Promise<T> {
  //   return this.databaseService.getRecordSimple<T>(pageId, options)
  // }

  // /** Returns the Advanced layer record. */
  // async getRecordAdvanced<T = any>(
  //   pageId: string,
  //   options: RecordGetOptions = {}
  // ): Promise<T> {
  //   return this.databaseService.getRecordAdvanced<T>(pageId, options)
  // }

  /** Returns the Raw Notion page response. */
  async getRecordRaw(pageId: string, options: RecordGetOptions = {}) {
    return this.databaseService.getRecordRaw(pageId, options)
  }

  // TODO: getPageContentSimple should be removed
  // and replaced with a single method that fetches the RAW page content and leaves the conversion
  // to Simple or Advanced blocks to the caller using the methods in our pageContentService.

  // /** Returns the Simple layer content (processed blocks). */
  // async getPageContentSimple(
  //   pageId: string,
  //   options: ContentOptions = {}
  // ): Promise<SimpleBlock[]> {
  //   const recursive = options.recursive ?? true
  //   return this.pageContentService.getPageContent(pageId, recursive)
  // }

  /**
   * Retrieve raw content blocks for a Notion page
   * @param pageId The ID of the Notion page
   * @param recursive Whether to recursively fetch nested blocks (default: true)
   */
  async getPageContentRaw(pageId: string, options: ContentOptions = {}) {
    const recursive = options.recursive ?? true
    return this.pageContentService.getPageContentRaw(pageId, recursive)
  }

  // /** Retrieve advanced content blocks for a Notion page */
  // async getPageContentAdvanced(pageId: string, options: ContentOptions = {}) {
  //   const recursive = options.recursive ?? true
  //   const resolver =
  //     options.mediaUrlResolver ||
  //     (async (_block: ContentBlockRaw, field: any) => {
  //       if (!field) return ""
  //       const src =
  //         field?.type === "external" ? field?.external?.url : field?.file?.url
  //       try {
  //         return await this.fileManager.processFileUrl(
  //           src || "",
  //           `content-block-${_block.id}`
  //         )
  //       } catch {
  //         return src || ""
  //       }
  //     })
  //   return this.contentProcessor.getAdvancedBlocks(pageId, recursive, resolver)
  // }

  /** @deprecated Use getPageContentSimple instead. This alias will be removed in the next major release. */
  async getPageContent(
    pageId: string,
    options: ContentOptions = {}
  ): Promise<ContentBlockRaw[]> {
    // TODO: remove deprecated alias after migration
    return this.getPageContentRaw(pageId, options)
  }
}

// Re-export types and utilities from ContentConverter, BlockProcessor, PageContentService, and DatabaseService
export { ContentConverter } from "./content/content-converter"
export { BlockProcessor } from "./content/processor"
export { PageContentService } from "./content/page-content-service"
export { ContentProcessor } from "./content/content-processor"
export { DatabaseService } from "./database/database-service"
export { richTextToPlain, richTextToMarkdown } from "./utils/rich-text"
export { richTextToHtml } from "./utils/rich-text"
export {
  groupConsecutiveListItems,
  mapRawBlocksWithDepth,
  walkRawBlocks
} from "./utils/block-traversal"
export { blocksToMarkdown } from "./content/block-content-converter/converter-raw-markdown"
export { blocksToHtml } from "./content/block-content-converter/converter-raw-html"

// Intentionally do not re-export generator to keep runtime free of ts-morph

// Registration helper to avoid prototype mutation in generated files
export function registerDatabase(
  key: string,
  config: { id: string; fields: DatabaseFieldMetadata }
) {
  // @ts-ignore - internal registry bag
  NotionCMS.prototype.databases[key] = config
}
