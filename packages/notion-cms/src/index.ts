import { Client } from "@notionhq/client";
import {
  DatabaseObjectResponse,
  PageObjectResponse,
  PropertyItemObjectResponse,
  QueryDatabaseParameters,
  GetPageResponse,
  BlockObjectResponse,
  ListBlockChildrenResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {
  getPropertyValue as generatorGetPropertyValue,
  NotionPropertyType,
  simplifyNotionRecord as generatorSimplifyNotionRecord,
  simplifyNotionRecords as generatorSimplifyNotionRecords,
  DatabaseRecord as GeneratorDatabaseRecord,
  AdvancedDatabaseRecord,
  advancedNotionRecord,
  advancedNotionRecords,
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
  DatabaseRecord,
  getPropertyValue,
  simplifyNotionRecord,
  simplifyNotionRecords,
  createSimplifyFunction,
  createSimplifyRecordsFunction,
} from "./utils/property-helpers";

// Re-export utility functions for use in projects
export {
  DatabaseRecord,
  getPropertyValue,
  simplifyNotionRecord,
  simplifyNotionRecords,
  createSimplifyFunction,
  createSimplifyRecordsFunction,
};

// Re-export query-builder types
export {
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

export class NotionCMS {
  private client: Client;

  constructor(token: string) {
    this.client = new Client({ auth: token });
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
      return new QueryBuilder<T, M>(this.client, databaseId, fieldMetadata);
    } else {
      return new QueryBuilder<T, M>(this.client, databaseId, {} as M);
    }
  }

  /**
   * Get all records from a Notion database with pagination, filtering, and sorting
   * Records include all access levels: simple, advanced, and raw
   * @param databaseId The ID of the Notion database
   * @param options Query options for filtering, sorting, and pagination
   * @returns A promise that resolves to an array of records with pagination metadata
   */
  async getDatabase<T extends DatabaseRecord>(
    databaseId: string,
    options: QueryOptions = {}
  ): Promise<{ results: T[]; nextCursor: string | null; hasMore: boolean }> {
    try {
      debug.query(databaseId, {
        database_id: databaseId,
        filter: options.filter,
        sorts: options.sorts,
        page_size: options.pageSize,
        start_cursor: options.startCursor,
      });

      const response = await this.client.databases.query({
        database_id: databaseId,
        filter: options.filter,
        sorts: options.sorts,
        page_size: options.pageSize,
        start_cursor: options.startCursor,
      });

      debug.log(`Query returned ${response.results.length} results`);

      const pages = response.results as PageObjectResponse[];
      // Use the unified processing function to get records with all access levels
      const results = processNotionRecords(pages) as T[];

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
   * @returns A promise that resolves to the record
   */
  async getRecord<T extends DatabaseRecord>(pageId: string): Promise<T> {
    const page = (await this.client.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;

    // Use the unified processing function
    return processNotionRecord(page) as T;
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
   * @param recursive Whether to recursively fetch nested blocks (default: false)
   * @returns A promise that resolves to an array of simplified blocks
   */
  async getPageContent(
    pageId: string,
    recursive: boolean = false
  ): Promise<SimpleBlock[]> {
    const blocks = await this.getBlocks(pageId);

    if (recursive) {
      // For each block with children, recursively fetch those children
      for (const block of blocks) {
        if (block.hasChildren) {
          block.children = await this.getPageContent(block.id, true);
        }
      }
    }

    return blocks;
  }

  /**
   * Fetch blocks for a specific page or block
   * @param blockId The ID of the page or block to fetch children for
   * @returns A promise that resolves to an array of simplified blocks
   */
  private async getBlocks(blockId: string): Promise<SimpleBlock[]> {
    let allBlocks: SimpleBlock[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await this.client.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor,
      });

      const blocks = response.results as BlockObjectResponse[];
      const simpleBlocks = blocks.map((block) => this.simplifyBlock(block));

      allBlocks = [...allBlocks, ...simpleBlocks];
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return allBlocks;
  }

  /**
   * Convert a Notion block to a simplified format
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
   * Extract the content from a Notion block based on its type
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

      case "column_list":
      case "column":
        // These are container blocks and their content is in children
        return {};

      default:
        return typeData || {};
    }
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
   * Convert page content to Markdown
   * @param blocks Array of blocks to convert
   * @param options Options for conversion
   * @returns Markdown string
   */
  public blocksToMarkdown(
    blocks: SimpleBlock[],
    options: { includeImageUrls?: boolean } = {}
  ): string {
    if (!blocks || !Array.isArray(blocks)) return "";

    const markdown = blocks
      .map((block) => this.blockToMarkdown(block, options))
      .join("\n\n");
    return markdown;
  }

  /**
   * Convert a single block to Markdown
   * @param block The block to convert
   * @param options Options for conversion
   * @param level Nesting level for recursive calls
   * @returns Markdown string
   */
  private blockToMarkdown(
    block: SimpleBlock,
    options: { includeImageUrls?: boolean } = {},
    level: number = 0
  ): string {
    const { type, content, children } = block;
    const { includeImageUrls = true } = options;
    const indent = "  ".repeat(level);

    let markdown = "";

    switch (type) {
      case "paragraph":
        markdown = `${indent}${content.text}`;
        break;

      case "heading_1":
        markdown = `${indent}# ${content.text}`;
        break;

      case "heading_2":
        markdown = `${indent}## ${content.text}`;
        break;

      case "heading_3":
        markdown = `${indent}### ${content.text}`;
        break;

      case "bulleted_list_item":
        markdown = `${indent}- ${content.text}`;
        break;

      case "numbered_list_item":
        markdown = `${indent}1. ${content.text}`;
        break;

      case "to_do":
        const checkbox = content.checked ? "[x]" : "[ ]";
        markdown = `${indent}- ${checkbox} ${content.text}`;
        break;

      case "toggle":
        markdown = `${indent}<details>\n${indent}<summary>${content.text}</summary>\n\n`;
        if (children && children.length > 0) {
          markdown += children
            .map((child) => this.blockToMarkdown(child, options, level + 1))
            .join("\n\n");
        }
        markdown += `\n${indent}</details>`;
        break;

      case "code":
        markdown = `${indent}\`\`\`${content.language || ""}\n${
          content.text
        }\n${indent}\`\`\``;
        break;

      case "quote":
        markdown = `${indent}> ${content.text}`;
        break;

      case "divider":
        markdown = `${indent}---`;
        break;

      case "image":
        const imageCaption = content.caption ? ` "${content.caption}"` : "";
        markdown = `${indent}![Image${imageCaption}](${content.url})`;
        if (includeImageUrls) {
          markdown += `\n${indent}<!-- ${content.url} -->`;
        }
        break;

      case "bookmark":
      case "embed":
      case "link_preview":
        markdown = `${indent}[${content.caption || content.url}](${
          content.url
        })`;
        break;

      case "callout":
        markdown = `${indent}> **${content.icon?.emoji || ""}** ${
          content.text
        }`;
        break;

      default:
        // For unsupported blocks, try to extract text if possible
        if (content && content.text) {
          markdown = `${indent}${content.text}`;
        } else {
          markdown = `${indent}<!-- Unsupported block type: ${type} -->`;
        }
    }

    // Add children recursively for blocks that weren't handled specially
    if (children && children.length > 0 && type !== "toggle") {
      markdown +=
        "\n\n" +
        children
          .map((child) => this.blockToMarkdown(child, options, level + 1))
          .join("\n\n");
    }

    return markdown;
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
}

// Re-export types and utilities
export * from "./generator";
