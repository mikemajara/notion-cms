import { Client } from "@notionhq/client"
import { QueryBuilder, DatabaseFieldMetadata } from "./database/query-builder"
import type {
  SortDirection,
  LogicalOperator,
  FilterCondition,
  QueryResult,
  NotionFieldType,
  OperatorMap,
  FieldTypeFor,
  OperatorsFor,
  SelectOptionsFor,
  ValueTypeFor,
  ValueTypeMap,
  TypeSafeFilterCondition
} from "./database/query-builder"
import type { ContentBlockRaw } from "./types/content-types"
import type { DatabaseRecord, DatabaseRecordType } from "./types/public"
import { NotionCMSConfig, mergeConfig } from "./config"
import { FileManager } from "./file-processor/file-manager"
import { PageContentService } from "./content/page-content-service"
import { DatabaseService } from "./database/database-service"
import { debug } from "./utils/debug"
import { getClient } from "./shared"

export interface DatabaseRegistry {
  // This will be extended by generated database-specific types
}

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
  public databases!: Record<
    string,
    { id: string; dataSourceId: string; fields: DatabaseFieldMetadata }
  >

  static {
    NotionCMS.prototype.databases = {}
  }

  constructor(token: string, config?: NotionCMSConfig) {
    this.client = getClient(token)
    this.config = mergeConfig(config)
    debug.configure(this.config.debug)
    this.fileManager = new FileManager(this.config)
    this.pageContentService = new PageContentService(
      this.client,
      this.fileManager
    )
    this.databaseService = new DatabaseService(this.client, this.fileManager)
  }

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
    if (!databaseConfig.dataSourceId) {
      throw new Error(
        `Database "${String(
          databaseKey
        )}" is missing a dataSourceId configuration. Regenerate your Notion CMS types to include data source metadata.`
      )
    }
    return this._query(
      databaseConfig.id,
      databaseConfig.dataSourceId,
      databaseConfig.fields,
      {
        recordType: options?.recordType || "raw"
      }
    )
  }

  private _query<T = DatabaseRecord, M extends DatabaseFieldMetadata = {}>(
    databaseId: string,
    dataSourceId: string,
    fieldMetadata?: M,
    options?: { recordType?: DatabaseRecordType }
  ): QueryBuilder<T, M> {
    return this.databaseService.query<T, M>(
      { databaseId, dataSourceId },
      fieldMetadata,
      options
    )
  }

  async getRecord(pageId: string) {
    return this.databaseService.getRecord(pageId)
  }

  async getPageContent(pageId: string, options: ContentOptions = {}) {
    const recursive = options.recursive ?? true
    return this.pageContentService.getPageContent(pageId, recursive)
  }
}

export function registerDatabase(
  key: string,
  config: { id: string; dataSourceId: string; fields: DatabaseFieldMetadata }
) {
  NotionCMS.prototype.databases[key] = config
}

export type {
  SortDirection,
  LogicalOperator,
  FilterCondition,
  QueryResult,
  NotionFieldType,
  OperatorMap,
  FieldTypeFor,
  OperatorsFor,
  SelectOptionsFor,
  ValueTypeFor,
  ValueTypeMap,
  TypeSafeFilterCondition
}
