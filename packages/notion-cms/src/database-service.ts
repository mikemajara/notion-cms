import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  PropertyItemObjectResponse,
  QueryDatabaseParameters,
  SelectPropertyItemObjectResponse,
  MultiSelectPropertyItemObjectResponse,
  DatePropertyItemObjectResponse,
  PeoplePropertyItemObjectResponse,
  FilesPropertyItemObjectResponse,
  CheckboxPropertyItemObjectResponse,
  NumberPropertyItemObjectResponse,
  FormulaPropertyItemObjectResponse,
  RelationPropertyItemObjectResponse,
  RollupPropertyItemObjectResponse,
  CreatedTimePropertyItemObjectResponse,
  CreatedByPropertyItemObjectResponse,
  LastEditedTimePropertyItemObjectResponse,
  LastEditedByPropertyItemObjectResponse,
  TitlePropertyItemObjectResponse,
  RichTextPropertyItemObjectResponse,
  UrlPropertyItemObjectResponse,
  EmailPropertyItemObjectResponse,
  PhoneNumberPropertyItemObjectResponse,
  UserObjectResponse,
  UniqueIdPropertyItemObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {
  DatabaseRecord,
  processNotionRecord,
  processNotionRecords,
} from "./generator";
import { QueryBuilder, DatabaseFieldMetadata } from "./query-builder";
import { debug } from "./utils/debug";
import { FileManager } from "./file-manager";

export interface QueryOptions {
  filter?: QueryDatabaseParameters["filter"];
  sorts?: QueryDatabaseParameters["sorts"];
  pageSize?: number;
  startCursor?: string;
}

/**
 * Database service for handling all Notion database operations
 */
export class DatabaseService {
  constructor(
    private client: Client,
    private fileManager: FileManager,
    private autoProcessFiles: boolean = false
  ) {}

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
      simple[key] = await this.getPropertyValue(
        value as PropertyItemObjectResponse,
        true
      );

      // Advanced version (detailed access)
      advanced[key] = await this.getPropertyValueAdvanced(
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
   * Async property value extraction for simple layer API
   * @param property Property item from Notion API
   * @param processFiles Whether to process files through FileManager (default: true)
   * @returns Processed property value for simple layer
   */
  async getPropertyValue(
    property: PropertyItemObjectResponse,
    processFiles: boolean = true
  ): Promise<any> {
    switch (property.type) {
      case "unique_id": {
        const idProp = property as UniqueIdPropertyItemObjectResponse;
        return idProp.unique_id.number;
      }
      case "title": {
        const titleProp = property as TitlePropertyItemObjectResponse;
        const richText = titleProp.title as unknown as Array<{
          plain_text: string;
        }>;
        return richText?.[0]?.plain_text ?? "";
      }
      case "rich_text": {
        const richTextProp = property as RichTextPropertyItemObjectResponse;
        const richText = richTextProp.rich_text as unknown as Array<{
          plain_text: string;
        }>;
        return richText?.[0]?.plain_text ?? "";
      }
      case "number":
        return (property as NumberPropertyItemObjectResponse).number;
      case "select":
        return (
          (property as SelectPropertyItemObjectResponse).select?.name ?? null
        );
      case "multi_select":
        return (
          property as MultiSelectPropertyItemObjectResponse
        ).multi_select.map((select) => select.name);
      case "date":
        const dateProp = property as DatePropertyItemObjectResponse;
        return dateProp.date ? new Date(dateProp.date.start) : null;
      case "people": {
        const peopleProp = property as PeoplePropertyItemObjectResponse;
        return Array.isArray(peopleProp.people)
          ? peopleProp.people.map(
              (person: UserObjectResponse) => person.name || ""
            )
          : [];
      }
      case "files": {
        const filesProp = property as FilesPropertyItemObjectResponse;
        const files = filesProp.files.map((file) => {
          if (file.type === "external") {
            return { name: file.name, url: file.external.url };
          } else if (file.type === "file") {
            return { name: file.name, url: file.file.url };
          } else {
            return { name: file.name, url: "" };
          }
        });

        // Process files through the FileManager for caching if enabled
        if (processFiles && this.fileManager?.isCacheEnabled()) {
          const processedFiles = await Promise.all(
            files.map(async (file) => {
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

        return files;
      }
      case "checkbox":
        return (property as CheckboxPropertyItemObjectResponse).checkbox;
      case "url":
        return (property as UrlPropertyItemObjectResponse).url;
      case "email":
        return (property as EmailPropertyItemObjectResponse).email;
      case "phone_number":
        return (property as PhoneNumberPropertyItemObjectResponse).phone_number;
      case "formula":
        return (property as FormulaPropertyItemObjectResponse).formula;
      case "relation": {
        const relationProp = property as RelationPropertyItemObjectResponse;
        return Array.isArray(relationProp.relation)
          ? relationProp.relation.map((rel: { id: string }) => rel.id)
          : [];
      }
      case "rollup":
        return (property as RollupPropertyItemObjectResponse).rollup;
      case "created_time":
        return (property as CreatedTimePropertyItemObjectResponse).created_time;
      case "created_by": {
        const createdBy = (property as CreatedByPropertyItemObjectResponse)
          .created_by as UserObjectResponse;
        return {
          id: createdBy.id,
          name: createdBy.name,
          avatar_url: createdBy.avatar_url,
        };
      }
      case "last_edited_time":
        return (property as LastEditedTimePropertyItemObjectResponse)
          .last_edited_time;
      case "last_edited_by": {
        const lastEditedBy = (
          property as LastEditedByPropertyItemObjectResponse
        ).last_edited_by as UserObjectResponse;
        return {
          id: lastEditedBy.id,
          name: lastEditedBy.name,
          avatar_url: lastEditedBy.avatar_url,
        };
      }
      default:
        return null;
    }
  }

  /**
   * Async advanced property value extraction for advanced layer API
   * @param property Property item from Notion API
   * @param processFiles Whether to process files through FileManager (default: true)
   * @returns Processed advanced property value with complete metadata
   */
  async getPropertyValueAdvanced(
    property: PropertyItemObjectResponse,
    processFiles: boolean = true
  ): Promise<any> {
    switch (property.type) {
      case "title": {
        const titleProp = property as TitlePropertyItemObjectResponse;
        // Ensure we're working with an array of rich text items
        if (!Array.isArray(titleProp.title)) {
          return [];
        }
        // Return full rich text array with all formatting information
        return titleProp.title.map((item) => ({
          content: item.plain_text,
          annotations: item.annotations,
          href: item.href,
          ...(item.type === "text" && {
            link: item.text.link,
          }),
        }));
      }
      case "rich_text": {
        const richTextProp = property as RichTextPropertyItemObjectResponse;
        // Ensure we're working with an array of rich text items
        if (!Array.isArray(richTextProp.rich_text)) {
          return [];
        }
        // Return full rich text array with all formatting information
        return richTextProp.rich_text.map((item) => ({
          content: item.plain_text,
          annotations: item.annotations,
          href: item.href,
          ...(item.type === "text" && {
            link: item.text.link,
          }),
        }));
      }
      case "number":
        return (property as NumberPropertyItemObjectResponse).number;
      case "select": {
        const selectProp = (property as SelectPropertyItemObjectResponse)
          .select;
        // Return full select object with id, name, and color
        return selectProp
          ? {
              id: selectProp.id,
              name: selectProp.name,
              color: selectProp.color,
            }
          : null;
      }
      case "multi_select": {
        const multiSelectProp = (
          property as MultiSelectPropertyItemObjectResponse
        ).multi_select;
        // Return array of full select objects with id, name, and color
        return multiSelectProp.map((select) => ({
          id: select.id,
          name: select.name,
          color: select.color,
        }));
      }
      case "date": {
        const dateProp = property as DatePropertyItemObjectResponse;
        if (!dateProp.date) return null;

        // Return complete date information including end date if available
        return {
          start: dateProp.date.start,
          end: dateProp.date.end,
          time_zone: dateProp.date.time_zone,
          // Also include a parsed Date object for convenience
          parsedStart: dateProp.date.start
            ? new Date(dateProp.date.start)
            : null,
          parsedEnd: dateProp.date.end ? new Date(dateProp.date.end) : null,
        };
      }
      case "people": {
        const peopleProp = property as PeoplePropertyItemObjectResponse;
        // Return more complete user information
        return Array.isArray(peopleProp.people)
          ? peopleProp.people.map((person: UserObjectResponse) => ({
              id: person.id,
              name: person.name,
              avatar_url: person.avatar_url,
              object: person.object,
              type: person.type,
              ...(person.type === "person" &&
                person.person && {
                  email: person.person.email,
                }),
            }))
          : [];
      }
      case "files": {
        const filesProp = property as FilesPropertyItemObjectResponse;
        // Return more complete file information
        const files = filesProp.files.map((file) => {
          if (file.type === "external") {
            return {
              name: file.name,
              type: file.type,
              external: {
                url: file.external.url,
              },
            };
          } else if (file.type === "file") {
            return {
              name: file.name,
              type: file.type,
              file: {
                url: file.file.url,
                expiry_time: file.file.expiry_time,
              },
            };
          } else {
            return { name: file.name, type: file.type };
          }
        });

        // Process files through the FileManager for caching if enabled
        if (processFiles && this.fileManager?.isCacheEnabled()) {
          const processedFiles = await Promise.all(
            files.map(async (file) => {
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

        return files;
      }
      case "checkbox":
        return (property as CheckboxPropertyItemObjectResponse).checkbox;
      case "url":
        return (property as UrlPropertyItemObjectResponse).url;
      case "email":
        return (property as EmailPropertyItemObjectResponse).email;
      case "phone_number":
        return (property as PhoneNumberPropertyItemObjectResponse).phone_number;
      case "formula": {
        const formulaProp = (property as FormulaPropertyItemObjectResponse)
          .formula;
        // Return the complete formula result with type information
        return {
          type: formulaProp.type,
          // Safely access value based on type
          value:
            formulaProp.type === "string"
              ? formulaProp.string
              : formulaProp.type === "number"
              ? formulaProp.number
              : formulaProp.type === "boolean"
              ? formulaProp.boolean
              : formulaProp.type === "date"
              ? formulaProp.date
              : null,
        };
      }
      case "relation": {
        const relationProp = property as RelationPropertyItemObjectResponse;
        // Return complete relation information
        return Array.isArray(relationProp.relation)
          ? relationProp.relation.map((rel) => ({
              id: rel.id,
            }))
          : [];
      }
      case "rollup": {
        const rollupProp = (property as RollupPropertyItemObjectResponse)
          .rollup;
        // Return the complete rollup with type information
        return {
          type: rollupProp.type,
          function: rollupProp.function,
          ...(rollupProp.type === "array" && {
            array: rollupProp.array,
          }),
          ...(rollupProp.type === "number" && {
            number: rollupProp.number,
          }),
          ...(rollupProp.type === "date" && {
            date: rollupProp.date,
          }),
        };
      }
      case "created_time":
        return {
          timestamp: (property as CreatedTimePropertyItemObjectResponse)
            .created_time,
          date: new Date(
            (property as CreatedTimePropertyItemObjectResponse).created_time
          ),
        };
      case "created_by": {
        const createdBy = (property as CreatedByPropertyItemObjectResponse)
          .created_by as UserObjectResponse;
        // Return more complete user information
        return {
          id: createdBy.id,
          name: createdBy.name,
          avatar_url: createdBy.avatar_url,
          object: createdBy.object,
          type: createdBy.type,
          ...(createdBy.type === "person" &&
            createdBy.person && {
              email: createdBy.person.email,
            }),
        };
      }
      case "last_edited_time":
        return {
          timestamp: (property as LastEditedTimePropertyItemObjectResponse)
            .last_edited_time,
          date: new Date(
            (
              property as LastEditedTimePropertyItemObjectResponse
            ).last_edited_time
          ),
        };
      case "last_edited_by": {
        const lastEditedBy = (
          property as LastEditedByPropertyItemObjectResponse
        ).last_edited_by as UserObjectResponse;
        // Return more complete user information
        return {
          id: lastEditedBy.id,
          name: lastEditedBy.name,
          avatar_url: lastEditedBy.avatar_url,
          object: lastEditedBy.object,
          type: lastEditedBy.type,
          ...(lastEditedBy.type === "person" &&
            lastEditedBy.person && {
              email: lastEditedBy.person.email,
            }),
        };
      }
      case "status": {
        const statusProp = (property as any).status;
        // Return full status object with id, name, and color
        return statusProp
          ? {
              id: statusProp.id,
              name: statusProp.name,
              color: statusProp.color,
            }
          : null;
      }
      case "unique_id": {
        const uniqueIdProp = (property as any).unique_id;
        // Return the unique ID object with prefix and number
        return uniqueIdProp
          ? {
              prefix: uniqueIdProp.prefix,
              number: uniqueIdProp.number,
            }
          : null;
      }
      default:
        return null;
    }
  }
}
