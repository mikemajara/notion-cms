import { Client } from "@notionhq/client"
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import type { ContentBlockRaw } from "../types/content-types"
import { SimpleBlock } from "./content-converter"
import { FileManager } from "../file-processor/file-manager"
import { convertBlocksToSimple } from "./block-converter"

export class PageContentService {
  constructor(private client: Client, private fileManager: FileManager) {}

  async getPageContent(
    pageId: string,
    recursive: boolean = true
  ): Promise<ContentBlockRaw[]> {
    const blocks = await this.getBlocks(pageId)
    if (recursive) {
      for (const block of blocks) {
        if ((block as any).has_children) {
          block.children = await this.getPageContent(block.id, true)
        }
      }
    }
    return blocks
  }

  private async getBlocks(blockId: string): Promise<ContentBlockRaw[]> {
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

      await Promise.all(rawBlocks.map((block) => this.enrichBlockFiles(block)))

      allBlocks = [...allBlocks, ...rawBlocks]
      hasMore = response.has_more
      startCursor = response.next_cursor || undefined
    }

    return allBlocks
  }

  async convertBlocksToSimple(
    blocks: ContentBlockRaw[]
  ): Promise<SimpleBlock[]> {
    return convertBlocksToSimple(blocks, { fileManager: this.fileManager })
  }

  private async enrichBlockFiles(block: ContentBlockRaw): Promise<void> {
    const blockType = (block as any).type
    const field = (block as any)[blockType]

    if (!field) {
      return
    }

    const processUrl = async (url?: string | null, fallbackName?: string) => {
      if (!url) return url
      try {
        return await this.fileManager.processFileUrl(
          url,
          fallbackName || `${block.id}-${blockType}`
        )
      } catch {
        return url
      }
    }

    const updateFileField = async (fileField: any, fallbackName?: string) => {
      if (!fileField) return

      if (fileField.type === "external" && fileField.external?.url) {
        fileField.external.url =
          (await processUrl(fileField.external.url, fallbackName)) ||
          fileField.external.url
      }

      if (fileField.type === "file" && fileField.file?.url) {
        fileField.file.url =
          (await processUrl(fileField.file.url, fallbackName)) ||
          fileField.file.url
      }
    }

    switch (blockType) {
      case "image":
      case "video":
      case "audio":
      case "file":
      case "pdf": {
        await updateFileField(field, field?.name)
        break
      }
      case "embed":
      case "bookmark":
      case "link_preview": {
        if (field.url) {
          field.url = (await processUrl(field.url, field?.url)) || field.url
        }
        break
      }
      case "callout": {
        if (field.icon && field.icon.type === "file") {
          await updateFileField(field.icon, `${block.id}-icon`)
        }
        break
      }
      default:
        break
    }
  }
}
