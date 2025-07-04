import { Client } from "@notionhq/client";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { BlockProcessor } from "./processor";
import { SimpleBlock } from "./converter";

/**
 * Page content service for retrieving and processing Notion page content
 */
export class PageContentService {
  constructor(
    private client: Client,
    private blockProcessor: BlockProcessor,
    private autoProcessFiles: boolean = false
  ) {}

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
        blocks.map((block) =>
          this.blockProcessor.simplifyBlockAsync(block, processFiles)
        )
      );

      allBlocks = [...allBlocks, ...simpleBlocks];
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return allBlocks;
  }
}
