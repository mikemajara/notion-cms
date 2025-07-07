import { Client } from "@notionhq/client";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { BlockProcessor } from "./processor";
import { SimpleBlock } from "./converter";

/**
 * Page content service for retrieving and processing Notion page content
 */
export class PageContentService {
  constructor(private client: Client, private blockProcessor: BlockProcessor) {}

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
      const simpleBlocks = await Promise.all(
        blocks.map((block) => this.blockProcessor.simplifyBlockAsync(block))
      );

      allBlocks = [...allBlocks, ...simpleBlocks];
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return allBlocks;
  }
}
