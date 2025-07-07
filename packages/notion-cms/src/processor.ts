import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { FileManager } from "./file-manager";
import { SimpleBlock } from "./converter";

/**
 * Block processing service for converting Notion blocks to simplified formats
 */
export class BlockProcessor {
  constructor(private fileManager: FileManager) {}

  /**
   * Convert a Notion block to a simplified format with file processing
   * @param block The Notion block to simplify
   * @returns A simplified representation of the block
   */
  async simplifyBlockAsync(block: BlockObjectResponse): Promise<SimpleBlock> {
    const { id, type, has_children } = block;

    // Extract the content based on the block type
    const content = await this.extractBlockContentAsync(block);

    return {
      id,
      type,
      content,
      hasChildren: has_children,
    };
  }

  /**
   * Extract the content from a Notion block based on its type with file processing
   * @param block The Notion block to extract content from
   * @returns The extracted content in a simplified format
   */
  async extractBlockContentAsync(block: BlockObjectResponse): Promise<any> {
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

        // Always process file through FileManager (strategy pattern handles behavior)
        try {
          url = await this.fileManager.processFileUrl(
            url,
            `content-block-${block.id}`
          );
        } catch (error) {
          console.warn(`Failed to process content block file: ${url}`, error);
          // Fall back to original URL
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
   * Convert a Notion block to a simplified format (legacy sync method)
   * @param block The Notion block to simplify
   * @returns A simplified representation of the block
   */
  simplifyBlock(block: BlockObjectResponse): SimpleBlock {
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
  extractBlockContent(block: BlockObjectResponse): any {
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

  /**
   * Extract plain text from rich text objects
   * @param richText Array of rich text objects
   * @returns Plain text string
   */
  private extractRichText(richText: any[] = []): string {
    if (!richText || !Array.isArray(richText)) return "";
    return richText.map((text) => text.plain_text || "").join("");
  }
}
