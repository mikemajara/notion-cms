import { Client } from "@notionhq/client"
import {
  PageObjectResponse,
  QueryDatabaseParameters
} from "@notionhq/client/build/src/api-endpoints"
import type { DatabaseRecordType } from "../types/public"
import type { DatabaseFieldMetadata } from "./query-builder"
import { QueryBuilder } from "./query-builder"
import { debug } from "../utils/debug"
import { FileManager } from "../file-processor/file-manager"

export interface QueryOptions {
  filter?: QueryDatabaseParameters["filter"]
  sorts?: QueryDatabaseParameters["sorts"]
  pageSize?: number
  startCursor?: string
}

export interface RecordOptions {
  recordType?: DatabaseRecordType
}

type FilesProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "files" }
>

type FilesPropertyFile = FilesProperty["files"][number]

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

  async getDatabase(
    databaseId: string,
    options: QueryOptions = {}
  ): Promise<{
    results: PageObjectResponse[]
    nextCursor: string | null
    hasMore: boolean
  }> {
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
      await Promise.all(pages.map((page) => this.enrichRecordFiles(page)))

      return {
        results: pages,
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

  async getRecord(pageId: string): Promise<PageObjectResponse> {
    return this.getRecordRaw(pageId)
  }

  async getRecordRaw(pageId: string): Promise<PageObjectResponse> {
    const page = (await this.client.pages.retrieve({
      page_id: pageId
    })) as PageObjectResponse
    await this.enrichRecordFiles(page)
    return page
  }

  async getAllDatabaseRecords(
    databaseId: string,
    options: Omit<QueryOptions, "startCursor" | "pageSize"> = {}
  ): Promise<PageObjectResponse[]> {
    const results: PageObjectResponse[] = []
    let hasMore = true
    let startCursor: string | null = null

    while (hasMore) {
      const response = await this.getDatabase(databaseId, {
        ...options,
        startCursor: startCursor || undefined
      })

      results.push(...response.results)
      hasMore = response.hasMore
      startCursor = response.nextCursor
    }

    return results
  }

  private async enrichRecordFiles(page: PageObjectResponse): Promise<void> {
    if (page.cover) {
      page.cover = await this.processPageCover(page.cover, `${page.id}-cover`)
    }

    if (page.icon && page.icon.type === "file") {
      page.icon = await this.processPageIcon(page.icon, `${page.id}-icon`)
    }

    const propertyEntries = Object.entries(page.properties)
    await Promise.all(
      propertyEntries.map(async ([key, property]) => {
        if (property.type === "files") {
          const filesProperty = property as FilesProperty
          filesProperty.files = await Promise.all(
            filesProperty.files.map((file, index) =>
              this.processPropertyFile(file, `${page.id}-${key}-${index}`)
            )
          )
        }
      })
    )
  }

  private async processPageCover(
    cover: Exclude<PageObjectResponse["cover"], null>,
    fallbackName: string
  ) {
    if (cover.type === "external") {
      const processedUrl = await this.safeProcessUrl(
        cover.external.url,
        fallbackName
      )
      cover.external.url = processedUrl
    } else if (cover.type === "file") {
      const processedUrl = await this.safeProcessUrl(
        cover.file.url,
        fallbackName
      )
      cover.file.url = processedUrl
    }
    return cover
  }

  private async processPageIcon(
    icon: Extract<PageObjectResponse["icon"], { type: "file" }>,
    fallbackName: string
  ) {
    const processedUrl = await this.safeProcessUrl(icon.file.url, fallbackName)
    icon.file.url = processedUrl
    return icon
  }

  private async processPropertyFile(
    file: FilesPropertyFile,
    fallbackName: string
  ): Promise<FilesPropertyFile> {
    const fileName = file.name || fallbackName
    const originalUrl = this.fileManager.extractFileUrl(file)
    if (!originalUrl) {
      return file
    }

    try {
      const processedUrl = await this.fileManager.processFileUrl(
        originalUrl,
        fileName
      )

      if (file.type === "external" && file.external) {
        file.external.url = processedUrl
      } else if (file.type === "file" && file.file) {
        file.file.url = processedUrl
      }
    } catch (error) {
      debug.error(error, {
        scope: "file-cache",
        fileName,
        originalUrl
      })
    }

    return file
  }

  private async safeProcessUrl(url: string, fallbackName: string) {
    try {
      return await this.fileManager.processFileUrl(url, fallbackName)
    } catch (error) {
      debug.error(error, {
        scope: "file-cache",
        fallbackName,
        originalUrl: url
      })
      return url
    }
  }
}
