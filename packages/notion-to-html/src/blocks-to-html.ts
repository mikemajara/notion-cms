import {
  escapeAttribute,
  escapeHtml,
  richTextToHtml,
  richTextToPlain
} from "./rich-text"
import type {
  HtmlAttributes,
  HtmlElementNode,
  HtmlNode,
  HtmlPlugin,
  HtmlRawNode,
  HtmlTextNode,
  HtmlNodeMeta,
  NotionBlock
} from "./types"

export interface RawHtmlOptions {
  debug?: boolean
  listClassName?: string
  todoClassName?: string
  columnClassName?: string
  plugins?: HtmlPlugin[]
}

interface ResolvedHtmlOptions {
  debug: boolean
  listClassName?: string
  todoClassName?: string
  columnClassName?: string
  plugins: HtmlPlugin[]
}

interface RenderEnvironment {
  options: ResolvedHtmlOptions
  blockMap: Map<string, NotionBlock>
}

const CLASS_COLUMNS = "notion-columns"
const CLASS_COLUMN = "notion-column"
const CLASS_BULLETED = "notion-bulleted-list"
const CLASS_NUMBERED = "notion-numbered-list"
const CLASS_TODO = "notion-todo-list"
const CLASS_DEBUG = "notion-debug-placeholder"
const CLASS_MEDIA = "notion-media"

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
])

const BOOLEAN_ATTRIBUTES = new Set([
  "checked",
  "disabled",
  "controls",
  "playsinline",
  "autoplay",
  "loop",
  "muted"
])

function resolveOptions(opts?: RawHtmlOptions): ResolvedHtmlOptions {
  const pluginList: HtmlPlugin[] = Array.isArray(opts?.plugins)
    ? (opts?.plugins as HtmlPlugin[])
    : []
  return {
    debug: opts?.debug ?? false,
    listClassName: opts?.listClassName,
    todoClassName: opts?.todoClassName,
    columnClassName: opts?.columnClassName,
    plugins: [...pluginList]
  }
}

function mergeClassNames(...names: (string | undefined)[]): string | undefined {
  const classes = names.filter(Boolean).join(" ")
  return classes || undefined
}

function getBlockType(block: NotionBlock): string {
  return (block as any).type as string
}

function getBlockField<T>(block: NotionBlock): T | undefined {
  const type = getBlockType(block)
  return (block as any)[type] as T
}

function registerBlock(env: RenderEnvironment, block?: NotionBlock): void {
  if (!block || !block.id) return
  env.blockMap.set(block.id, block)
}

function createMeta(
  level: number,
  block?: NotionBlock,
  blockTypeOverride?: string
): HtmlNodeMeta {
  const meta: HtmlNodeMeta = {
    level
  }

  if (block) {
    meta.blockId = block.id
    meta.blockType = blockTypeOverride ?? getBlockType(block)
  } else if (blockTypeOverride) {
    meta.blockType = blockTypeOverride
  }

  return meta
}

function createElementForBlock(
  env: RenderEnvironment,
  tagName: string,
  block: NotionBlock | undefined,
  level: number,
  attributes: HtmlAttributes = {},
  children: HtmlNode[] = [],
  blockTypeOverride?: string
): HtmlElementNode {
  registerBlock(env, block)
  const attrs: HtmlAttributes = { ...attributes }
  attrs["data-level"] = attrs["data-level"] ?? String(level)
  const blockType =
    blockTypeOverride ?? (block ? getBlockType(block) : undefined)
  if (blockType && attrs["data-type"] === undefined) {
    attrs["data-type"] = blockType
  }
  const meta = createMeta(level, block, blockTypeOverride)
  return {
    kind: "element",
    tagName,
    attributes: attrs,
    children,
    meta
  }
}

function createElement(
  tagName: string,
  level: number,
  attributes: HtmlAttributes = {},
  children: HtmlNode[] = [],
  metaOverrides: Partial<HtmlNodeMeta> = {}
): HtmlElementNode {
  const meta: HtmlNodeMeta = {
    blockId: metaOverrides.blockId,
    blockType: metaOverrides.blockType,
    level: metaOverrides.level ?? level
  }
  const attrs: HtmlAttributes = { ...attributes }
  attrs["data-level"] = attrs["data-level"] ?? String(meta.level)
  if (meta.blockType && attrs["data-type"] === undefined) {
    attrs["data-type"] = meta.blockType
  }
  return {
    kind: "element",
    tagName,
    attributes: attrs,
    children,
    meta
  }
}

function createRawForBlock(
  env: RenderEnvironment,
  html: string,
  block: NotionBlock | undefined,
  level: number,
  blockTypeOverride?: string
): HtmlRawNode {
  registerBlock(env, block)
  return {
    kind: "raw",
    html,
    meta: createMeta(level, block, blockTypeOverride)
  }
}

function createTextForBlock(
  env: RenderEnvironment,
  value: string,
  block: NotionBlock | undefined,
  level: number,
  blockTypeOverride?: string
): HtmlTextNode {
  registerBlock(env, block)
  return {
    kind: "text",
    value,
    meta: createMeta(level, block, blockTypeOverride)
  }
}

function renderChildren(
  env: RenderEnvironment,
  block: NotionBlock,
  depth: number
): HtmlNode[] {
  const children = (block as any).children as NotionBlock[] | undefined
  if (!children || children.length === 0) return []
  return renderBlocks(env, children, depth + 1)
}

function renderListItems(
  env: RenderEnvironment,
  items: NotionBlock[],
  listType: "bulleted_list_item" | "numbered_list_item",
  depth: number
): HtmlElementNode | null {
  if (!items.length) return null
  const containerTag = listType === "bulleted_list_item" ? "ul" : "ol"
  const baseClass =
    listType === "bulleted_list_item" ? CLASS_BULLETED : CLASS_NUMBERED
  const className = mergeClassNames(baseClass, env.options.listClassName)
  const attrs: HtmlAttributes = {}
  if (className) {
    attrs.class = className
  }
  const list = createElementForBlock(
    env,
    containerTag,
    items[0],
    depth,
    attrs,
    [],
    listType
  )

  list.children = items.map((item) => {
    const field = getBlockField<any>(item)
    const textHtml = richTextToHtml(field?.rich_text ?? [])
    const liChildren: HtmlNode[] = []
    if (textHtml) {
      liChildren.push(createRawForBlock(env, textHtml, item, depth + 1))
    }
    liChildren.push(...renderChildren(env, item, depth + 1))
    return createElementForBlock(env, "li", item, depth + 1, {}, liChildren)
  })

  return list
}

function renderTodoItems(
  env: RenderEnvironment,
  items: NotionBlock[],
  depth: number
): HtmlElementNode | null {
  if (!items.length) return null
  const className = mergeClassNames(CLASS_TODO, env.options.todoClassName)
  const attrs: HtmlAttributes = {}
  if (className) {
    attrs.class = className
  }
  const list = createElementForBlock(
    env,
    "ul",
    items[0],
    depth,
    attrs,
    [],
    "to_do"
  )

  list.children = items.map((item) => {
    const field = getBlockField<any>(item)
    const textHtml = richTextToHtml(field?.rich_text ?? [])
    const checked = Boolean(field?.checked)
    const liChildren: HtmlNode[] = []

    const inputAttrs: HtmlAttributes = { type: "checkbox", disabled: "" }
    if (checked) {
      inputAttrs.checked = ""
    }

    const checkbox = createElement(
      "input",
      depth + 1,
      inputAttrs,
      [],
      {
        blockId: item.id,
        blockType: getBlockType(item)
      }
    )

    const span = createElement(
      "span",
      depth + 1,
      {},
      [],
      {
        blockId: item.id,
        blockType: getBlockType(item)
      }
    )

    if (textHtml) {
      span.children.push(
        createRawForBlock(env, textHtml, item, depth + 1)
      )
    }

    liChildren.push(checkbox, span)
    liChildren.push(...renderChildren(env, item, depth + 1))

    return createElementForBlock(env, "li", item, depth + 1, {}, liChildren)
  })

  return list
}

function renderTable(
  env: RenderEnvironment,
  block: NotionBlock,
  depth: number
): HtmlElementNode | null {
  const tableField = getBlockField<any>(block)
  const rows = ((block as any).children as NotionBlock[] | undefined) || []
  const cellRows = rows.map((row) => {
    const field = getBlockField<any>(row)
    const cells = (field?.cells as any[] | undefined) || []
    return cells.map((cell) => richTextToHtml(Array.isArray(cell) ? cell : []))
  })

  if (cellRows.length === 0) return null

  const hasColumnHeader = Boolean(tableField?.has_column_header)
  const hasRowHeader = Boolean(tableField?.has_row_header)

  const table = createElementForBlock(env, "table", block, depth)
  const children: HtmlNode[] = []

  if (hasColumnHeader) {
    const headerCells = cellRows[0] || []
    const thead = createElement(
      "thead",
      depth + 1,
      {},
      [],
      {
        blockId: block.id,
        blockType: getBlockType(block)
      }
    )
    const headerRow = createElement(
      "tr",
      depth + 2,
      {},
      [],
      {
        blockId: block.id,
        blockType: getBlockType(block)
      }
    )

    headerRow.children = headerCells.map((cellHtml) => {
      const th = createElement(
        "th",
        depth + 3,
        {},
        [],
        {
          blockId: block.id,
          blockType: getBlockType(block)
        }
      )
      if (cellHtml) {
        th.children.push(createRawForBlock(env, cellHtml, block, depth + 3))
      }
      return th
    })

    thead.children.push(headerRow)
    children.push(thead)
  }

  const bodyRows = hasColumnHeader ? cellRows.slice(1) : cellRows
  const tbody = createElement(
    "tbody",
    depth + 1,
    {},
    [],
    {
      blockId: block.id,
      blockType: getBlockType(block)
    }
  )

  tbody.children = bodyRows.map((rowCells) => {
    const tr = createElement(
      "tr",
      depth + 2,
      {},
      [],
      {
        blockId: block.id,
        blockType: getBlockType(block)
      }
    )

    tr.children = rowCells.map((cellHtml, index) => {
      const isHeader = hasRowHeader && index === 0
      const tagName = isHeader ? "th" : "td"
      const cellAttrs: HtmlAttributes = {}
      if (isHeader) {
        cellAttrs.scope = "row"
      }
      const cellNode = createElement(
        tagName,
        depth + 3,
        cellAttrs,
        [],
        {
          blockId: block.id,
          blockType: getBlockType(block)
        }
      )
      if (cellHtml) {
        cellNode.children.push(
          createRawForBlock(env, cellHtml, block, depth + 3)
        )
      }
      return cellNode
    })

    return tr
  })

  children.push(tbody)
  table.children = children
  return table
}

function renderMediaFigure(
  env: RenderEnvironment,
  block: NotionBlock,
  kind:
    | "bookmark"
    | "embed"
    | "link_preview"
    | "image"
    | "video"
    | "audio"
    | "file"
    | "pdf",
  url: string | undefined,
  captionHtml: string,
  captionPlain: string,
  depth: number
): HtmlElementNode | null {
  if (!url) return null
  const figureClass = mergeClassNames(CLASS_MEDIA, `notion-${kind}`)
  const attrs: HtmlAttributes = {}
  if (figureClass) {
    attrs.class = figureClass
  }
  const figure = createElementForBlock(
    env,
    "figure",
    block,
    depth,
    attrs,
    [],
    kind
  )

  const figcaption =
    captionHtml && captionHtml.length
      ? createElement(
          "figcaption",
          depth + 1,
          {},
          [createRawForBlock(env, captionHtml, block, depth + 1)],
          {
            blockId: block.id,
            blockType: getBlockType(block)
          }
        )
      : null

  const safeUrl = escapeAttribute(url)

  switch (kind) {
    case "bookmark":
    case "embed":
    case "link_preview": {
      const label = captionHtml || escapeHtml(url)
      const anchor = createElement(
        "a",
        depth + 1,
        { href: safeUrl },
        [],
        {
          blockId: block.id,
          blockType: getBlockType(block)
        }
      )
      anchor.children.push(createRawForBlock(env, label, block, depth + 1))
      figure.children.push(anchor)
      if (figcaption) figure.children.push(figcaption)
      return figure
    }
    case "image": {
      const alt =
        captionPlain && captionPlain.length
          ? escapeAttribute(captionPlain)
          : "Notion image"
      const img = createElement(
        "img",
        depth + 1,
        { src: safeUrl, alt, loading: "lazy" },
        [],
        {
          blockId: block.id,
          blockType: getBlockType(block)
        }
      )
      figure.children.push(img)
      if (figcaption) figure.children.push(figcaption)
      return figure
    }
    case "video": {
      const video = createElement(
        "video",
        depth + 1,
        { src: safeUrl, controls: "", playsinline: "" },
        [],
        {
          blockId: block.id,
          blockType: getBlockType(block)
        }
      )
      figure.children.push(video)
      if (figcaption) figure.children.push(figcaption)
      return figure
    }
    case "audio": {
      const audio = createElement(
        "audio",
        depth + 1,
        { src: safeUrl, controls: "" },
        [],
        {
          blockId: block.id,
          blockType: getBlockType(block)
        }
      )
      figure.children.push(audio)
      if (figcaption) figure.children.push(figcaption)
      return figure
    }
    case "file": {
      const label = captionHtml || escapeHtml(captionPlain || "Download file")
      const anchor = createElement(
        "a",
        depth + 1,
        { href: safeUrl },
        [],
        {
          blockId: block.id,
          blockType: getBlockType(block)
        }
      )
      anchor.children.push(createRawForBlock(env, label, block, depth + 1))
      figure.children.push(anchor)
      if (figcaption) figure.children.push(figcaption)
      return figure
    }
    case "pdf": {
      const object = createElement(
        "object",
        depth + 1,
        { data: safeUrl, type: "application/pdf" },
        [],
        {
          blockId: block.id,
          blockType: getBlockType(block)
        }
      )
      figure.children.push(object)
      if (figcaption) figure.children.push(figcaption)
      return figure
    }
    default:
      return null
  }
}

function buildStructuralPlaceholder(
  env: RenderEnvironment,
  kind: string,
  block: NotionBlock,
  title: string | undefined,
  depth: number
): HtmlElementNode {
  const attrs: HtmlAttributes = {
    class: CLASS_DEBUG,
    "data-kind": kind,
    "data-block-id": block.id
  }
  const children: HtmlNode[] = []
  if (title) {
    children.push(createTextForBlock(env, title, block, depth))
  }
  return createElementForBlock(
    env,
    "div",
    block,
    depth,
    attrs,
    children,
    kind
  )
}

function renderBlock(
  env: RenderEnvironment,
  block: NotionBlock,
  depth: number
): HtmlNode[] {
  const type = getBlockType(block)
  const field = getBlockField<any>(block)

  switch (type) {
    case "paragraph": {
      const textHtml = richTextToHtml(field?.rich_text ?? [])
      const children: HtmlNode[] = []
      if (textHtml) {
        children.push(createRawForBlock(env, textHtml, block, depth))
      }
      const paragraph = createElementForBlock(
        env,
        "p",
        block,
        depth,
        {},
        children
      )
      return [paragraph, ...renderChildren(env, block, depth)]
    }
    case "toggle": {
      const summaryHtml = richTextToHtml(field?.rich_text ?? [])
      const summaryNode =
        summaryHtml.length > 0
          ? createElement(
              "summary",
              depth + 1,
              {},
              [createRawForBlock(env, summaryHtml, block, depth + 1)],
              {
                blockId: block.id,
                blockType: type,
                level: depth + 1
              }
            )
          : null
      const childContent = renderChildren(env, block, depth)
      const body =
        childContent.length > 0
          ? createElement(
              "div",
              depth + 1,
              {},
              childContent,
              {
                blockId: block.id,
                blockType: type,
                level: depth + 1
              }
            )
          : null
      const detailsChildren: HtmlNode[] = []
      if (summaryNode) detailsChildren.push(summaryNode)
      if (body) detailsChildren.push(body)
      const details = createElementForBlock(
        env,
        "details",
        block,
        depth,
        {},
        detailsChildren
      )
      return [details]
    }
    case "quote": {
      const textHtml = richTextToHtml(field?.rich_text ?? [])
      const quoteChildren: HtmlNode[] = []
      if (textHtml) {
        quoteChildren.push(createRawForBlock(env, textHtml, block, depth))
      }
      quoteChildren.push(...renderChildren(env, block, depth))
      const quote = createElementForBlock(
        env,
        "blockquote",
        block,
        depth,
        {},
        quoteChildren
      )
      return [quote]
    }
    case "heading_1":
    case "heading_2":
    case "heading_3": {
      const tagName =
        type === "heading_1" ? "h1" : type === "heading_2" ? "h2" : "h3"
      const textHtml = richTextToHtml(field?.rich_text ?? [])
      const children: HtmlNode[] = []
      if (textHtml) {
        children.push(createRawForBlock(env, textHtml, block, depth))
      }
      const heading = createElementForBlock(
        env,
        tagName,
        block,
        depth,
        {},
        children
      )
      return [heading]
    }
    case "code": {
      const language = field?.language || ""
      const plain = escapeHtml(richTextToPlain(field?.rich_text ?? []))
      const codeAttrs: HtmlAttributes = {}
      if (language) {
        codeAttrs["data-language"] = language
      }
      const code = createElement(
        "code",
        depth + 1,
        codeAttrs,
        [createRawForBlock(env, plain, block, depth + 1)],
        {
          blockId: block.id,
          blockType: type,
          level: depth + 1
        }
      )
      const pre = createElementForBlock(
        env,
        "pre",
        block,
        depth,
        {},
        [code]
      )
      return [pre]
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const url = field?.url || ""
      const caption = richTextToHtml(field?.caption ?? [])
      const captionPlain = richTextToPlain(field?.caption ?? [])
      const figure = renderMediaFigure(
        env,
        block,
        type,
        url,
        caption,
        captionPlain,
        depth
      )
      const extras = renderChildren(env, block, depth)
      return figure ? [figure, ...extras] : extras
    }
    case "image":
    case "video":
    case "audio":
    case "file":
    case "pdf": {
      const src =
        field?.type === "external" ? field?.external?.url : field?.file?.url
      const caption = richTextToHtml(field?.caption ?? [])
      const captionPlain = richTextToPlain(field?.caption ?? [])
      const figure = renderMediaFigure(
        env,
        block,
        type,
        src,
        caption,
        captionPlain,
        depth
      )
      return figure ? [figure] : []
    }
    case "equation": {
      const expression = field?.expression || ""
      const attr = escapeAttribute(expression)
      const span = createElementForBlock(
        env,
        "span",
        block,
        depth,
        { "data-notion-equation": attr },
        [createRawForBlock(env, escapeHtml(expression), block, depth)],
        type
      )
      return [span]
    }
    case "divider": {
      const hr = createElementForBlock(env, "hr", block, depth)
      return [hr]
    }
    case "table": {
      const table = renderTable(env, block, depth)
      return table ? [table] : []
    }
    case "table_row": {
      return []
    }
    case "column_list":
    case "columns": {
      const className = mergeClassNames(CLASS_COLUMNS, env.options.columnClassName)
      const attrs: HtmlAttributes = {}
      if (className) attrs.class = className
      const children = renderChildren(env, block, depth)
      const div = createElementForBlock(env, "div", block, depth, attrs, children)
      return [div]
    }
    case "column": {
      const className = mergeClassNames(CLASS_COLUMN, env.options.columnClassName)
      const attrs: HtmlAttributes = {}
      if (className) attrs.class = className
      const children = renderChildren(env, block, depth)
      const div = createElementForBlock(env, "div", block, depth, attrs, children)
      return [div]
    }
    case "synced_block": {
      return renderChildren(env, block, depth)
    }
    case "child_page": {
      if (!env.options.debug) return []
      const title = (field?.title as string | undefined) || ""
      return [buildStructuralPlaceholder(env, "child_page", block, title, depth)]
    }
    case "child_database": {
      if (!env.options.debug) return []
      const title = (field?.title as string | undefined) || ""
      return [buildStructuralPlaceholder(env, "child_database", block, title, depth)]
    }
    case "breadcrumb": {
      if (!env.options.debug) return []
      return [buildStructuralPlaceholder(env, "breadcrumb", block, undefined, depth)]
    }
    case "table_of_contents": {
      if (!env.options.debug) return []
      return [
        buildStructuralPlaceholder(
          env,
          "table_of_contents",
          block,
          undefined,
          depth
        )
      ]
    }
    case "template": {
      return renderChildren(env, block, depth)
    }
    case "to_do":
    case "bulleted_list_item":
    case "numbered_list_item": {
      return []
    }
    default:
      return []
  }
}

function renderBlocks(
  env: RenderEnvironment,
  blocks: NotionBlock[] = [],
  depth = 0
): HtmlNode[] {
  if (!Array.isArray(blocks) || blocks.length === 0) return []

  const nodes: HtmlNode[] = []
  let index = 0

  while (index < blocks.length) {
    const block = blocks[index]
    const type = getBlockType(block)

    if (type === "bulleted_list_item" || type === "numbered_list_item") {
      const listType = type
      const items: NotionBlock[] = []
      while (
        index < blocks.length &&
        getBlockType(blocks[index]) === listType
      ) {
        items.push(blocks[index])
        index++
      }
      const listNode = renderListItems(env, items, listType, depth)
      if (listNode) nodes.push(listNode)
      continue
    }

    if (type === "to_do") {
      const items: NotionBlock[] = []
      while (index < blocks.length && getBlockType(blocks[index]) === "to_do") {
        items.push(blocks[index])
        index++
      }
      const todoNode = renderTodoItems(env, items, depth)
      if (todoNode) nodes.push(todoNode)
      continue
    }

    nodes.push(...renderBlock(env, block, depth))
    index++
  }

  return nodes
}

interface PluginEntry {
  plugin: HtmlPlugin
  store: Map<string, unknown>
}

function preparePluginEntries(plugins: HtmlPlugin[]): PluginEntry[] {
  return [...plugins]
    .filter(Boolean)
    .sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
    )
    .map((plugin) => ({
      plugin,
      store: new Map<string, unknown>()
    }))
}

function cloneMeta(meta: HtmlNodeMeta): HtmlNodeMeta {
  return {
    blockId: meta.blockId,
    blockType: meta.blockType,
    level: meta.level
  }
}

function createElementFromMeta(
  meta: HtmlNodeMeta,
  tagName: string,
  attributes: HtmlAttributes = {},
  children: HtmlNode[] = []
): HtmlElementNode {
  const attrs: HtmlAttributes = { ...attributes }
  attrs["data-level"] = attrs["data-level"] ?? String(meta.level)
  if (meta.blockType && attrs["data-type"] === undefined) {
    attrs["data-type"] = meta.blockType
  }
  return {
    kind: "element",
    tagName,
    attributes: attrs,
    children,
    meta: cloneMeta(meta)
  }
}

function createPostProcessContext(
  entry: PluginEntry,
  node: HtmlNode,
  ancestors: HtmlElementNode[],
  blockMap: Map<string, NotionBlock>
) {
  let skipped = false
  const meta = node.meta
  const block = meta.blockId ? blockMap.get(meta.blockId) : undefined

  return {
    block,
    level: meta.level,
    ancestors: [...ancestors],
    getState<T>(key: string): T | undefined {
      return entry.store.get(key) as T | undefined
    },
    setState<T>(key: string, value: T): void {
      entry.store.set(key, value)
    },
    deleteState(key: string): void {
      entry.store.delete(key)
    },
    createElement(
      tagName: string,
      attributes: HtmlAttributes = {},
      children: HtmlNode[] = []
    ): HtmlElementNode {
      return createElementFromMeta(meta, tagName, attributes, children)
    },
    createText(value: string): HtmlTextNode {
      return {
        kind: "text",
        value,
        meta: cloneMeta(meta)
      }
    },
    createRaw(html: string): HtmlRawNode {
      return {
        kind: "raw",
        html,
        meta: cloneMeta(meta)
      }
    },
    skipRemaining(): void {
      skipped = true
    },
    get skipped(): boolean {
      return skipped
    }
  }
}

function processNode(
  node: HtmlNode,
  ancestors: HtmlElementNode[],
  entries: PluginEntry[],
  blockMap: Map<string, NotionBlock>
): HtmlNode {
  let current = node

  for (const entry of entries) {
    const handler = entry.plugin.postProcess
    if (!handler) continue
    const context = createPostProcessContext(entry, current, ancestors, blockMap)
    const result = handler(current, context)
    if (result) {
      current = result
    }
    if (context.skipped) {
      break
    }
  }

  if (current.kind === "element") {
    ancestors.push(current)
    const processedChildren = current.children.map((child) =>
      processNode(child, ancestors, entries, blockMap)
    )
    current.children = processedChildren
    ancestors.pop()
  }

  return current
}

function runPostProcessors(
  nodes: HtmlNode[],
  plugins: HtmlPlugin[],
  blockMap: Map<string, NotionBlock>
): HtmlNode[] {
  if (!plugins.length) return nodes
  const entries = preparePluginEntries(plugins)
  const ancestors: HtmlElementNode[] = []
  return nodes.map((node) => processNode(node, ancestors, entries, blockMap))
}

function serializeAttributes(attributes: HtmlAttributes): string {
  const entries = Object.entries(attributes)
  if (entries.length === 0) return ""
  entries.sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
  const serialized = entries
    .map(([key, value]) => {
      if (value === undefined) return ""
      if (BOOLEAN_ATTRIBUTES.has(key) && value === "") {
        return key
      }
      return `${key}="${escapeAttribute(String(value))}"`
    })
    .filter(Boolean)
    .join(" ")
  return serialized ? ` ${serialized}` : ""
}

function serializeNode(node: HtmlNode): string {
  switch (node.kind) {
    case "element": {
      const attrs = serializeAttributes(node.attributes)
      if (VOID_ELEMENTS.has(node.tagName)) {
        return `<${node.tagName}${attrs} />`
      }
      const children = node.children.map(serializeNode).join("")
      return `<${node.tagName}${attrs}>${children}</${node.tagName}>`
    }
    case "text": {
      return escapeHtml(node.value)
    }
    case "raw": {
      return node.html
    }
    default:
      return ""
  }
}

function serializeNodes(nodes: HtmlNode[]): string {
  if (!nodes.length) return ""
  return nodes.map(serializeNode).join("")
}

export function blocksToHtml(
  rawBlocks: NotionBlock[] = [],
  opts?: RawHtmlOptions
): string {
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return ""
  const options = resolveOptions(opts)
  const env: RenderEnvironment = {
    options,
    blockMap: new Map()
  }
  const nodes = renderBlocks(env, rawBlocks, 0)
  const processedNodes = runPostProcessors(nodes, options.plugins, env.blockMap)
  return serializeNodes(processedNodes)
}

