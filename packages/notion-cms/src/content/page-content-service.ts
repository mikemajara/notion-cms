import { Client } from "@notionhq/client"
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import type { ContentBlockRaw } from "../content-types"
import { BlockProcessor } from "./processor"
import { SimpleBlock } from "./content-converter"

export class PageContentService {
  constructor(private client: Client, private blockProcessor: BlockProcessor) {}

  async getPageContent(
    pageId: string,
    recursive: boolean = true
  ): Promise<SimpleBlock[]> {
    const blocks = await this.getBlocks(pageId)
    if (recursive) {
      for (const block of blocks) {
        if (block.hasChildren) {
          block.children = await this.getPageContent(block.id, true)
        }
      }
    }
    return blocks
  }

  async getPageContentRaw(
    pageId: string,
    recursive: boolean = true
  ): Promise<ContentBlockRaw[]> {
    const blocks = await this.getBlocksRaw(pageId)
    if (recursive) {
      for (const block of blocks) {
        if ((block as any).has_children) {
          block.children = await this.getPageContentRaw(block.id, true)
        }
      }
    }
    return blocks
  }

  private async getBlocks(blockId: string): Promise<SimpleBlock[]> {
    let allBlocks: SimpleBlock[] = []
    let hasMore = true
    let startCursor: string | undefined = undefined

    while (hasMore) {
      const response = await this.client.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor
      })

      const blocks = response.results as BlockObjectResponse[]
      const simpleBlocks = await Promise.all(
        blocks.map((block) => this.blockProcessor.simplifyBlockAsync(block))
      )

      allBlocks = [...allBlocks, ...simpleBlocks]
      hasMore = response.has_more
      startCursor = response.next_cursor || undefined
    }

    return allBlocks
  }

  private async getBlocksRaw(blockId: string): Promise<ContentBlockRaw[]> {
    let allBlocks: ContentBlockRaw[] = []
    let hasMore = true
    let startCursor: string | undefined = undefined

    while (hasMore) {
      const response = await this.client.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor
      })

      const blocks = response.results as BlockObjectResponse[]
      const rawBlocks: ContentBlockRaw[] = blocks as ContentBlockRaw[]

      allBlocks = [...allBlocks, ...rawBlocks]
      hasMore = response.has_more
      startCursor = response.next_cursor || undefined
    }

    return allBlocks
  }
}
