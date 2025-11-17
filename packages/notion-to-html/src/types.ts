import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"

export type NotionBlock = BlockObjectResponse & {
  children?: NotionBlock[]
}

export type HtmlAttributes = Record<string, string>

export type HtmlNode =
  | HtmlElementNode
  | HtmlTextNode
  | HtmlRawNode

export interface HtmlElementNode {
  kind: "element"
  tagName: string
  attributes: HtmlAttributes
  children: HtmlNode[]
  meta: HtmlNodeMeta
}

export interface HtmlTextNode {
  kind: "text"
  value: string
  meta: HtmlNodeMeta
}

export interface HtmlRawNode {
  kind: "raw"
  html: string
  meta: HtmlNodeMeta
}

export interface HtmlNodeMeta {
  blockId?: string
  blockType?: string
  level: number
}

export interface HtmlPlugin {
  id: string
  priority?: number
  postProcess?: (
    node: HtmlNode,
    context: PluginPostProcessContext
  ) => HtmlNode | void
}

export interface PluginPostProcessContext {
  block?: NotionBlock
  level: number
  ancestors: HtmlElementNode[]
  getState<T>(key: string): T | undefined
  setState<T>(key: string, value: T): void
  deleteState(key: string): void
  createElement(
    tagName: string,
    attributes?: HtmlAttributes,
    children?: HtmlNode[]
  ): HtmlElementNode
  createText(value: string): HtmlTextNode
  createRaw(html: string): HtmlRawNode
  skipRemaining(): void
  readonly skipped: boolean
}

