import { Client } from "@notionhq/client"
import {
  PageObjectResponse,
  QueryDatabaseParameters,
  PropertyItemObjectResponse
} from "@notionhq/client/build/src/api-endpoints"
import type { DatabaseRecordType } from "../types/public"
import type { DatabaseFieldMetadata } from "./query-builder"
import { QueryBuilder } from "./query-builder"
import { debug } from "../utils/debug"
import { FileManager } from "../file-processor/file-manager"
import { getPropertyValueSimple } from "./database-record-converter/converter-record-simple"
import { getPropertyValueAdvanced } from "./database-record-converter/converter-record-advanced"

export interface QueryOptions {
  filter?: QueryDatabaseParameters["filter"]
  sorts?: QueryDatabaseParameters["sorts"]
  pageSize?: number
  startCursor?: string
}

export interface RecordOptions {
  recordType?: DatabaseRecordType
}

// Common options for explicit record getters across all layers
export interface RecordGetOptions {}

export class DatabaseService {
  constructor(private client: Client, private fileManager: FileManager) {}

  query<T, M extends DatabaseFieldMetadata = {}>(
    databaseId: string,
    fieldMetadata?: M,
    options?: RecordOptions
  ): QueryBuilder<T, M> {
    if (fieldMetadata) {
      return new QueryBuilder<T, M>(
        this.client,
        databaseId,
        fieldMetadata,
        this.fileManager,
        options?.recordType || "simple"
      )
    } else {
      return new QueryBuilder<T, M>(
        this.client,
        databaseId,
        {} as M,
        this.fileManager,
        options?.recordType || "simple"
      )
    }
  }

  async getDatabase<T>(
    databaseId: string,
    options: QueryOptions & RecordOptions = {}
  ): Promise<{ results: T[]; nextCursor: string | null; hasMore: boolean }> {
    try {
      debug.query(databaseId, {
        database_id: databaseId,
        filter: options.filter,
        sorts: options.sorts,
        page_size: options.pageSize,
        start_cursor: options.startCursor
      })

      const response = await this.client.databases.query({
        database_id: databaseId,
        filter: options.filter,
        sorts: options.sorts,
        page_size: options.pageSize,
        start_cursor: options.startCursor
      })

      debug.log(`Query returned ${response.results.length} results`)

      const pages = response.results as PageObjectResponse[]
      const results = await this.processNotionRecords<T>(
        pages,
        options.recordType || "simple"
      )

      return {
        results,
        nextCursor: response.next_cursor,
        hasMore: response.has_more
      }
    } catch (error) {
      debug.error(error, {
        databaseId,
        options
      })
      throw error
    }
  }

  // TODO: getRecordSimple and getRecordAdvanced should be removed, this service
  // should only implement getRecord which will always return a raw record.

  // async getRecordSimple<T>(
  //   pageId: string,
  // ): Promise<T> {
  //   const page = (await this.client.pages.retrieve({
  //     page_id: pageId
  //   })) as PageObjectResponse
  //   return await this.processNotionRecord<T>(page, "simple")
  // }

  // async getRecordAdvanced<T>(
  //   pageId: string,
  //   _options: RecordGetOptions = {}
  // ): Promise<T> {
  //   const page = (await this.client.pages.retrieve({
  //     page_id: pageId
  //   })) as PageObjectResponse
  //   return await this.processNotionRecord<T>(page, "advanced")
  // }

  async getRecord(pageId: string): Promise<PageObjectResponse> {
    const page = (await this.client.pages.retrieve({
      page_id: pageId
    })) as PageObjectResponse
    return await this.processNotionRecord<PageObjectResponse>(page, "raw")
  }

  async getAllDatabaseRecords<T>(
    databaseId: string,
    options: Omit<QueryOptions, "startCursor" | "pageSize"> & RecordOptions = {}
  ): Promise<T[]> {
    const results: T[] = []
    let hasMore = true
    let startCursor: string | null = null

    while (hasMore) {
      const response: {
        results: T[]
        nextCursor: string | null
        hasMore: boolean
      } = await this.getDatabase<T>(databaseId, {
        ...options,
        startCursor: startCursor || undefined
      })

      results.push(...response.results)
      hasMore = response.hasMore
      startCursor = response.nextCursor
    }

    return results
  }

  // TODO: review the purpose of this function definition `processNotionRecord`
  // and check whether this should be moved to the recordProcessor service.
  // ideally the recordProcessor would convert a block from raw to simple or advanced
  // the caching strategy should be defined at the root of the NotionCMS class
  // so once the we are converting the record from raw to advanced or simple,
  // the properties should have already been modified.

  /**
   * Unified processing for a single page to DatabaseRecord
   */
  async processNotionRecord<T = any>(
    page: PageObjectResponse,
    recordType: DatabaseRecordType
  ): Promise<T> {
    if (recordType === "raw") {
      return page as unknown as T
    }

    if (recordType === "advanced") {
      const advanced: Record<string, any> = { id: page.id }
      for (const [key, value] of Object.entries(page.properties)) {
        advanced[key] = await getPropertyValueAdvanced(
          value as PropertyItemObjectResponse,
          this.fileManager
        )
      }
      return advanced as T
    }

    const simple: Record<string, any> = { id: page.id }
    for (const [key, value] of Object.entries(page.properties)) {
      simple[key] = await getPropertyValueSimple(
        value as PropertyItemObjectResponse,
        this.fileManager
      )
    }
    return simple as T
  }

  async processNotionRecords<T = any>(
    pages: PageObjectResponse[],
    recordType: DatabaseRecordType
  ): Promise<T[]> {
    return Promise.all(
      pages.map((page) => this.processNotionRecord<T>(page, recordType))
    )
  }
}
