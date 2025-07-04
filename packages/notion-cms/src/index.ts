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

/**
 * Simplified representation of a Notion block
 */
export interface SimpleBlock {
  id: string;
  type: string;
  content: any;
  children?: SimpleBlock[];
  hasChildren: boolean;
}

/**
 * Table block content structure
 */
interface TableBlockContent {
  tableWidth: number;
  hasColumnHeader: boolean;
  hasRowHeader: boolean;
}

/**
 * Table row cell content structure
 */
interface TableRowCell {
  plainText: string;
  richText: any[];
}

/**
 * Table row block content structure
 */
interface TableRowBlockContent {
  cells: TableRowCell[];
}

/**
 * Simplified representation of a table block
 */
interface SimpleTableBlock extends SimpleBlock {
  type: "table";
  content: TableBlockContent;
  children: SimpleTableRowBlock[];
}

/**
 * Simplified representation of a table row block
 */
interface SimpleTableRowBlock extends SimpleBlock {
  type: "table_row";
  content: TableRowBlockContent;
}

/**
 * Context for tracking list state during markdown conversion
 */
interface ListContext {
  type: "bullet" | "numbered" | null;
  level: number;
  numbering: number[]; // Track numbering at each level
  bulletStyles: string[]; // Different bullet styles for different levels
}

export class NotionCMS {
  private client: Client;
  private config: Required<NotionCMSConfig>;
  private fileManager: FileManager;
  private autoProcessFiles: boolean;

  constructor(token: string, config?: NotionCMSConfig) {
    this.client = new Client({ auth: token });
    this.config = mergeConfig(config);
    this.fileManager = new FileManager(this.config);
    // Auto-enable file processing if cache strategy is configured
    this.autoProcessFiles = this.config.files?.strategy === "cache";
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
    const shouldProcessFiles = options.processFiles ?? this.autoProcessFiles;
    const blocks = await this.getBlocks(pageId, shouldProcessFiles);

    if (recursive) {
      // For each block with children, recursively fetch those children
      for (const block of blocks) {
        if (block.hasChildren) {
          block.children = await this.getPageContent(block.id, true, options);
        }
      }
    }
    return blocks;
  }

  /**
   * Fetch blocks for a specific page or block
   * @param blockId The ID of the page or block to fetch children for
   * @param processFiles Whether to process files through FileManager
   * @returns A promise that resolves to an array of simplified blocks
   */
  private async getBlocks(
    blockId: string,
    processFiles: boolean = false
  ): Promise<SimpleBlock[]> {
    let allBlocks: SimpleBlock[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await this.client.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor,
      });

      const blocks = response.results as BlockObjectResponse[];
      const simpleBlocks = await Promise.all(
        blocks.map((block) => this.simplifyBlockAsync(block, processFiles))
      );

      allBlocks = [...allBlocks, ...simpleBlocks];
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return allBlocks;
  }

  /**
   * Convert a Notion block to a simplified format with optional file processing
   * @param block The Notion block to simplify
   * @param processFiles Whether to process files through FileManager
   * @returns A simplified representation of the block
   */
  private async simplifyBlockAsync(
    block: BlockObjectResponse,
    processFiles: boolean = false
  ): Promise<SimpleBlock> {
    const { id, type, has_children } = block;

    // Extract the content based on the block type
    const content = await this.extractBlockContentAsync(block, processFiles);

    return {
      id,
      type,
      content,
      hasChildren: has_children,
    };
  }

  /**
   * Extract the content from a Notion block based on its type with optional file processing
   * @param block The Notion block to extract content from
   * @param processFiles Whether to process files through FileManager
   * @returns The extracted content in a simplified format
   */
  private async extractBlockContentAsync(
    block: BlockObjectResponse,
    processFiles: boolean = false
  ): Promise<any> {
    const { type } = block;

    // Accessing the block's content based on its type
    // @ts-ignore - Dynamic access to block properties
    const typeData = block[type];

    switch (type) {
      case "paragraph":
      case "heading_1":
      case "heading_2":
      case "heading_3":
      case "bulleted_list_item":
      case "numbered_list_item":
      case "toggle":
      case "quote":
        // These blocks have rich text content
        return {
          text: this.extractRichText(typeData.rich_text),
          richText: typeData.rich_text,
        };

      case "code":
        return {
          text: this.extractRichText(typeData.rich_text),
          language: typeData.language,
        };

      case "image":
      case "file":
      case "pdf":
      case "video":
      case "audio":
        // These blocks have file content
        const fileType = typeData.type; // 'external' or 'file'
        let url =
          fileType === "external" ? typeData.external.url : typeData.file.url;

        // Process file through FileManager if enabled
        if (processFiles && this.fileManager?.isCacheEnabled()) {
          try {
            url = await this.fileManager.processFileUrl(
              url,
              `content-block-${block.id}`
            );
          } catch (error) {
            console.warn(`Failed to cache content block file: ${url}`, error);
            // Fall back to original URL
          }
        }

        return {
          caption: typeData.caption
            ? this.extractRichText(typeData.caption)
            : "",
          url: url,
        };

      case "bookmark":
      case "embed":
      case "link_preview":
        return {
          url: typeData.url,
          caption: typeData.caption
            ? this.extractRichText(typeData.caption)
            : "",
        };

      case "divider":
      case "equation":
      case "table_of_contents":
        // These blocks don't have additional content
        return {};

      case "to_do":
        return {
          text: this.extractRichText(typeData.rich_text),
          checked: typeData.checked,
        };

      case "callout":
        return {
          text: this.extractRichText(typeData.rich_text),
          icon: typeData.icon,
        };

      case "table":
        return {
          tableWidth: typeData.table_width,
          hasColumnHeader: typeData.has_column_header,
          hasRowHeader: typeData.has_row_header,
        };

      case "table_row":
        return {
          cells: typeData.cells.map((cell: any[]) => ({
            plainText: this.extractRichText(cell),
            richText: cell,
          })),
        };

      case "column_list":
      case "column":
        // These are container blocks and their content is in children
        return {};

      default:
        return typeData || {};
    }
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

  /**
   * Convert page content to Markdown
   * @param blocks Array of blocks to convert
   * @param options Options for conversion
   * @returns Markdown string
   */
  public blocksToMarkdown(blocks: SimpleBlock[]): string {
    if (!blocks || !Array.isArray(blocks)) return "";

    const context: ListContext = {
      type: null,
      level: 0,
      numbering: [],
      bulletStyles: ["-", "*", "+", "-"], // Cycle through different bullet styles
    };

    return this.processBlocksGroup(blocks, context);
  }

  /**
   * Process a group of blocks, handling list grouping and proper spacing
   * @param blocks Array of blocks to process
   * @param options Conversion options
   * @param context Current list context
   * @returns Processed markdown string
   */
  private processBlocksGroup(
    blocks: SimpleBlock[],
    context: ListContext
  ): string {
    if (!blocks || blocks.length === 0) return "";

    const result: string[] = [];
    let i = 0;

    while (i < blocks.length) {
      const block = blocks[i];

      if (this.isListItem(block.type)) {
        // Process consecutive list items as a group
        const listGroup = this.extractListGroup(blocks, i);
        const listMarkdown = this.processListGroup(listGroup.blocks, context);
        result.push(listMarkdown);
        i = listGroup.nextIndex;
      } else {
        // Process single non-list block
        const blockMarkdown = this.blockToMarkdown(block, context);
        if (blockMarkdown.trim()) {
          result.push(blockMarkdown);
        }
        i++;
      }
    }

    return result.join("\n\n");
  }

  /**
   * Check if a block type is a list item
   */
  private isListItem(type: string): boolean {
    return type === "bulleted_list_item" || type === "numbered_list_item";
  }

  /**
   * Extract consecutive list items of the same type
   */
  private extractListGroup(
    blocks: SimpleBlock[],
    startIndex: number
  ): { blocks: SimpleBlock[]; nextIndex: number } {
    const firstBlock = blocks[startIndex];
    const listType = firstBlock.type;
    const listBlocks: SimpleBlock[] = [];
    let i = startIndex;

    while (i < blocks.length && blocks[i].type === listType) {
      listBlocks.push(blocks[i]);
      i++;
    }

    return { blocks: listBlocks, nextIndex: i };
  }

  /**
   * Process a group of list items with proper numbering and indentation
   */
  private processListGroup(
    blocks: SimpleBlock[],
    parentContext: ListContext
  ): string {
    if (blocks.length === 0) return "";

    const firstBlock = blocks[0];
    const listType =
      firstBlock.type === "bulleted_list_item" ? "bullet" : "numbered";

    // Create new context for this list level
    const context: ListContext = {
      type: listType,
      level: parentContext.level,
      numbering: [...parentContext.numbering],
      bulletStyles: parentContext.bulletStyles,
    };

    // Initialize numbering for this level if it's a numbered list
    if (listType === "numbered") {
      if (context.numbering.length <= context.level) {
        context.numbering[context.level] = 1;
      }
    }

    const result: string[] = [];

    blocks.forEach((block) => {
      const blockMarkdown = this.blockToMarkdown(block, context);
      if (blockMarkdown.trim()) {
        result.push(blockMarkdown);
      }

      // Increment numbering for numbered lists
      if (listType === "numbered" && context.numbering.length > context.level) {
        context.numbering[context.level]++;
      }
    });

    return result.join("\n");
  }

  /**
   * Convert a single block to Markdown
   * @param block The block to convert
   * @param options Options for conversion
   * @param context Current list context and nesting information
   * @returns Markdown string
   */
  private blockToMarkdown(block: SimpleBlock, context: ListContext): string {
    const { type, content, children } = block;

    // Calculate proper indentation based on context
    const baseIndent = "  ".repeat(context.level);
    let markdown = "";

    switch (type) {
      case "paragraph":
        markdown = `${baseIndent}${content.text}`;
        break;

      case "heading_1":
        markdown = `${baseIndent}# ${content.text}`;
        break;

      case "heading_2":
        markdown = `${baseIndent}## ${content.text}`;
        break;

      case "heading_3":
        markdown = `${baseIndent}### ${content.text}`;
        break;

      case "bulleted_list_item":
        const bulletStyle =
          context.bulletStyles[context.level % context.bulletStyles.length];
        markdown = `${baseIndent}${bulletStyle} ${content.text}`;
        break;

      case "numbered_list_item":
        const number = context.numbering[context.level] || 1;
        markdown = `${baseIndent}${number}. ${content.text}`;
        break;

      case "to_do":
        const checkbox = content.checked ? "[x]" : "[ ]";
        markdown = `${baseIndent}- ${checkbox} ${content.text}`;
        break;

      case "toggle":
        markdown = `${baseIndent}<details>\n${baseIndent}<summary>${content.text}</summary>\n\n`;
        if (children && children.length > 0) {
          const childContext: ListContext = {
            ...context,
            level: context.level + 1,
          };
          markdown += this.processBlocksGroup(children, childContext);
        }
        markdown += `\n${baseIndent}</details>`;
        break;

      case "code":
        markdown = `${baseIndent}\`\`\`${content.language || ""}\n${
          content.text
        }\n${baseIndent}\`\`\``;
        break;

      case "quote":
        markdown = `${baseIndent}> ${content.text}`;
        break;

      case "divider":
        markdown = `${baseIndent}---`;
        break;

      case "image":
        const imageCaption = content.caption ? ` "${content.caption}"` : "";
        markdown = `${baseIndent}![Image${imageCaption}](${content.url})`;
        break;

      case "bookmark":
      case "embed":
      case "link_preview":
        markdown = `${baseIndent}[${content.caption || content.url}](${
          content.url
        })`;
        break;

      case "callout":
        markdown = `${baseIndent}> **${content.icon?.emoji || ""}** ${
          content.text
        }`;
        break;

      case "table":
        markdown = this.tableToMarkdown(block as SimpleTableBlock, baseIndent);
        break;

      case "table_row":
        // Table rows are handled within table conversion, skip individual processing
        markdown = "";
        break;

      default:
        // For unsupported blocks, try to extract text if possible
        if (content && content.text) {
          markdown = `${baseIndent}${content.text}`;
        } else {
          markdown = `${baseIndent}<!-- Unsupported block type: ${type} -->`;
        }
    }

    // Add children recursively for list items with proper nesting
    if (children && children.length > 0 && type !== "toggle") {
      if (this.isListItem(type)) {
        // For list items, children should be indented and maintain list context
        const childContext: ListContext = {
          ...context,
          level: context.level + 1,
        };
        const childrenMarkdown = this.processBlocksGroup(
          children,
          childContext
        );
        if (childrenMarkdown.trim()) {
          markdown += "\n" + childrenMarkdown;
        }
      } else {
        // For non-list items, add children with normal spacing
        const childContext: ListContext = {
          ...context,
          level: context.level + 1,
        };
        const childrenMarkdown = this.processBlocksGroup(
          children,
          childContext
        );
        if (childrenMarkdown.trim()) {
          markdown += "\n\n" + childrenMarkdown;
        }
      }
    }

    return markdown;
  }

  /**
   * Convert a table block to Markdown format
   * @param tableBlock The table block to convert
   * @param baseIndent Base indentation to apply
   * @returns Markdown string
   */
  private tableToMarkdown(
    tableBlock: SimpleTableBlock,
    baseIndent: string
  ): string {
    const { content, children } = tableBlock;

    if (!children || children.length === 0) {
      return `${baseIndent}<!-- Empty table -->`;
    }

    const rows = children as SimpleTableRowBlock[];
    const tableRows: string[] = [];

    // Process each row
    rows.forEach((row, rowIndex) => {
      const cells = row.content.cells.map((cell) => cell.plainText || "");
      const markdownRow = `${baseIndent}| ${cells.join(" | ")} |`;
      tableRows.push(markdownRow);

      // Add header separator after first row (required for valid Markdown tables)
      if (rowIndex === 0) {
        const separator = `${baseIndent}|${cells
          .map(() => " --- ")
          .join("|")}|`;
        tableRows.push(separator);
      }
    });

    return tableRows.join("\n");
  }

  /**
   * Convert page content to HTML
   * @param blocks Array of blocks to convert
   * @returns HTML string
   */
  public blocksToHtml(blocks: SimpleBlock[]): string {
    if (!blocks || !Array.isArray(blocks)) return "";

    const html = blocks.map((block) => this.blockToHtml(block)).join("");
    return html;
  }

  /**
   * Convert a single block to HTML
   * @param block The block to convert
   * @param level Nesting level for recursive calls
   * @returns HTML string
   */
  private blockToHtml(block: SimpleBlock, level: number = 0): string {
    const { type, content, children } = block;

    let html = "";

    switch (type) {
      case "paragraph":
        html = `<p>${content.text}</p>`;
        break;

      case "heading_1":
        html = `<h1>${content.text}</h1>`;
        break;

      case "heading_2":
        html = `<h2>${content.text}</h2>`;
        break;

      case "heading_3":
        html = `<h3>${content.text}</h3>`;
        break;

      case "bulleted_list_item":
        html = `<li>${content.text}</li>`;
        // If it's part of a list, we'll wrap it in <ul> later
        if (level === 0) {
          html = `<ul>${html}</ul>`;
        }
        break;

      case "numbered_list_item":
        html = `<li>${content.text}</li>`;
        // If it's part of a list, we'll wrap it in <ol> later
        if (level === 0) {
          html = `<ol>${html}</ol>`;
        }
        break;

      case "to_do":
        const checked = content.checked ? " checked" : "";
        html = `<div class="to-do"><input type="checkbox"${checked} disabled /><span>${content.text}</span></div>`;
        break;

      case "toggle":
        html = `<details>
          <summary>${content.text}</summary>
          ${
            children && children.length > 0
              ? children
                  .map((child) => this.blockToHtml(child, level + 1))
                  .join("")
              : ""
          }
        </details>`;
        break;

      case "code":
        html = `<pre><code class="language-${
          content.language || "plaintext"
        }">${content.text}</code></pre>`;
        break;

      case "quote":
        html = `<blockquote>${content.text}</blockquote>`;
        break;

      case "divider":
        html = `<hr />`;
        break;

      case "image":
        const caption = content.caption
          ? `<figcaption>${content.caption}</figcaption>`
          : "";
        html = `<figure><img src="${content.url}" alt="${
          content.caption || "Image"
        }" />${caption}</figure>`;
        break;

      case "bookmark":
      case "embed":
      case "link_preview":
        html = `<a href="${
          content.url
        }" target="_blank" rel="noopener noreferrer">${
          content.caption || content.url
        }</a>`;
        break;

      case "callout":
        const icon = content.icon?.emoji
          ? `<span class="icon">${content.icon.emoji}</span>`
          : "";
        html = `<div class="callout">${icon}<div class="callout-content">${content.text}</div></div>`;
        break;

      case "table":
        html = this.tableToHtml(block as SimpleTableBlock);
        break;

      case "table_row":
        // Table rows are handled within table conversion, skip individual processing
        html = "";
        break;

      default:
        // For unsupported blocks, try to extract text if possible
        if (content && content.text) {
          html = `<div>${content.text}</div>`;
        } else {
          html = `<!-- Unsupported block type: ${type} -->`;
        }
    }

    // Add children recursively for blocks that weren't handled specially
    if (children && children.length > 0 && type !== "toggle") {
      // Special handling for list types to maintain proper HTML structure
      if (type === "bulleted_list_item" && level === 0) {
        html = `<ul>${html}${children
          .map((child) => this.blockToHtml(child, level + 1))
          .join("")}</ul>`;
      } else if (type === "numbered_list_item" && level === 0) {
        html = `<ol>${html}${children
          .map((child) => this.blockToHtml(child, level + 1))
          .join("")}</ol>`;
      } else {
        html += children
          .map((child) => this.blockToHtml(child, level + 1))
          .join("");
      }
    }

    return html;
  }

  /**
   * Convert a table block to HTML format
   * @param tableBlock The table block to convert
   * @returns HTML string
   */
  private tableToHtml(tableBlock: SimpleTableBlock): string {
    const { content, children } = tableBlock;

    if (!children || children.length === 0) {
      return `<!-- Empty table -->`;
    }

    const rows = children as SimpleTableRowBlock[];
    let tableHtml = "<table>";

    rows.forEach((row, rowIndex) => {
      const isHeaderRow = rowIndex === 0 && content.hasColumnHeader;
      const cellTag = isHeaderRow ? "th" : "td";

      const cells = row.content.cells
        .map((cell) => `<${cellTag}>${cell.plainText || ""}</${cellTag}>`)
        .join("");

      const rowHtml = `<tr>${cells}</tr>`;

      // Wrap header row in thead, body rows in tbody
      if (isHeaderRow) {
        tableHtml += `<thead>${rowHtml}</thead>`;
        if (rows.length > 1) {
          tableHtml += "<tbody>";
        }
      } else {
        tableHtml += rowHtml;
      }
    });

    // Close tbody if we opened it
    if (content.hasColumnHeader && rows.length > 1) {
      tableHtml += "</tbody>";
    }

    tableHtml += "</table>";
    return tableHtml;
  }

  /**
   * Extract plain text from rich text objects
   * @param richText Array of rich text objects
   * @returns Plain text string
   */
  private extractRichText(richText: any[] = []): string {
    if (!richText || !Array.isArray(richText)) return "";
    return richText.map((text) => text.plain_text || "").join("");
  }

  /**
   * Convert a Notion block to a simplified format (legacy sync method)
   * @param block The Notion block to simplify
   * @returns A simplified representation of the block
   */
  private simplifyBlock(block: BlockObjectResponse): SimpleBlock {
    const { id, type, has_children } = block;

    // Extract the content based on the block type
    const content = this.extractBlockContent(block);

    return {
      id,
      type,
      content,
      hasChildren: has_children,
    };
  }

  /**
   * Extract the content from a Notion block based on its type (legacy sync method)
   * @param block The Notion block to extract content from
   * @returns The extracted content in a simplified format
   */
  private extractBlockContent(block: BlockObjectResponse): any {
    const { type } = block;

    // Accessing the block's content based on its type
    // @ts-ignore - Dynamic access to block properties
    const typeData = block[type];

    switch (type) {
      case "paragraph":
      case "heading_1":
      case "heading_2":
      case "heading_3":
      case "bulleted_list_item":
      case "numbered_list_item":
      case "toggle":
      case "quote":
        // These blocks have rich text content
        return {
          text: this.extractRichText(typeData.rich_text),
          richText: typeData.rich_text,
        };

      case "code":
        return {
          text: this.extractRichText(typeData.rich_text),
          language: typeData.language,
        };

      case "image":
      case "file":
      case "pdf":
      case "video":
      case "audio":
        // These blocks have file content
        const fileType = typeData.type; // 'external' or 'file'
        return {
          caption: typeData.caption
            ? this.extractRichText(typeData.caption)
            : "",
          // Get URL based on whether it's external or internal
          url:
            fileType === "external" ? typeData.external.url : typeData.file.url,
        };

      case "bookmark":
      case "embed":
      case "link_preview":
        return {
          url: typeData.url,
          caption: typeData.caption
            ? this.extractRichText(typeData.caption)
            : "",
        };

      case "divider":
      case "equation":
      case "table_of_contents":
        // These blocks don't have additional content
        return {};

      case "to_do":
        return {
          text: this.extractRichText(typeData.rich_text),
          checked: typeData.checked,
        };

      case "callout":
        return {
          text: this.extractRichText(typeData.rich_text),
          icon: typeData.icon,
        };

      case "table":
        return {
          tableWidth: typeData.table_width,
          hasColumnHeader: typeData.has_column_header,
          hasRowHeader: typeData.has_row_header,
        };

      case "table_row":
        return {
          cells: typeData.cells.map((cell: any[]) => ({
            plainText: this.extractRichText(cell),
            richText: cell,
          })),
        };

      case "column_list":
      case "column":
        // These are container blocks and their content is in children
        return {};

      default:
        return typeData || {};
    }
  }
}

// Re-export types and utilities
export * from "./generator";
