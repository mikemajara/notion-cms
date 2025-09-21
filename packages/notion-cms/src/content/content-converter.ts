import type { ContentBlockRaw } from "../types/content-types"
import {
  blocksToMarkdown,
  type RawMarkdownOptions
} from "./block-content-converter/converter-raw-markdown"
import {
  blocksToHtml,
  type RawHtmlOptions
} from "./block-content-converter/converter-raw-html"
import {
  blocksToAdvanced,
  type RawAdvancedOptions
} from "./block-content-converter/converter-raw-advanced"

export interface SimpleBlock {
  id: string
  type: string
  content: any
  children?: SimpleBlock[]
  hasChildren: boolean
}

export interface TableBlockContent {
  tableWidth: number
  hasColumnHeader: boolean
  hasRowHeader: boolean
}

export interface TableRowCell {
  plainText: string
  richText: any[]
}

export interface TableRowBlockContent {
  cells: TableRowCell[]
}

export interface SimpleTableBlock extends SimpleBlock {
  type: "table"
  content: TableBlockContent
  children: SimpleTableRowBlock[]
}

export interface SimpleTableRowBlock extends SimpleBlock {
  type: "table_row"
  content: TableRowBlockContent
}

export class ContentConverter {
  public blocksToMarkdown(
    blocks: ContentBlockRaw[],
    options?: RawMarkdownOptions
  ): string {
    return blocksToMarkdown(blocks, options)
  }

  public blocksToHtml(
    blocks: ContentBlockRaw[],
    options?: RawHtmlOptions
  ): string {
    return blocksToHtml(blocks, options)
  }

  public async blocksToAdvanced(
    blocks: ContentBlockRaw[],
    options?: RawAdvancedOptions
  ) {
    return blocksToAdvanced(blocks, options)
  }
}
