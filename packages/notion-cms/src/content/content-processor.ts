import type { ContentBlockRaw } from "../types/content-types"
import { PageContentService } from "./page-content-service"
import { blocksToAdvanced } from "./block-content-converter/converter-raw-advanced"

// TODO: this class should be removed, it doesn't follow the single responsibility
// principle. It's just a wrapper around blocksToAdvanced, which adds a dependency on
// the pageContentService.

/**
 * @deprecated Use ContentConverter instead. This class will be removed in the next major release.
 */
export class ContentProcessor {
  constructor(private pageContent: PageContentService) {}

  async getAdvancedBlocks(
    pageId: string,
    recursive: boolean = true,
    mediaUrlResolver?: (block: ContentBlockRaw, file: any) => Promise<string>
  ) {
    const raw = await this.pageContent.getPageContent(pageId, recursive)
    return blocksToAdvanced(raw, { mediaUrlResolver })
  }
}
