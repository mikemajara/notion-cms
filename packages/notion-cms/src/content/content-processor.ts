import type { ContentBlockRaw } from "../content-types"
import { PageContentService } from "./page-content-service"
import { blocksToAdvanced } from "./block-content-converter/converter-raw-advanced"

export class ContentProcessor {
  constructor(private pageContent: PageContentService) {}

  async getAdvancedBlocks(
    pageId: string,
    recursive: boolean = true,
    mediaUrlResolver?: (block: ContentBlockRaw, file: any) => Promise<string>
  ) {
    const raw = await this.pageContent.getPageContentRaw(pageId, recursive)
    return blocksToAdvanced(raw, { mediaUrlResolver })
  }
}
