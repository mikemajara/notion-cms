import type { ContentBlockRaw } from "../content-types"

/**
 * Block traversal utilities for processing Notion content blocks
 *
 * This module provides utilities for traversing and grouping Notion blocks,
 * particularly for handling list items and nested block structures.
 *
 * Key functionality:
 * - Groups consecutive list items of the same type into logical groups
 * - Provides depth-aware traversal of nested block structures
 * - Handles different list types (bulleted and numbered lists)
 * - Enables efficient processing of hierarchical content structures
 *
 * Used by content converters (markdown, HTML) to properly format
 * lists and maintain correct nesting relationships.
 */

export type ListGroupType = "bulleted_list_item" | "numbered_list_item"

export interface ContentListGroup {
  kind: "list_group"
  listType: ListGroupType
  items: ContentBlockRaw[]
}

export type ContentGroupedNode = ContentBlockRaw | ContentListGroup

export function isGroupableListType(type: string): type is ListGroupType {
  return type === "bulleted_list_item" || type === "numbered_list_item"
}

export function groupConsecutiveListItems(
  siblings: ContentBlockRaw[]
): ContentGroupedNode[] {
  const result: ContentGroupedNode[] = []
  let i = 0
  while (i < siblings.length) {
    const current = siblings[i]
    const type = (current as any).type as string

    if (isGroupableListType(type)) {
      const listType: ListGroupType = type
      const items: ContentBlockRaw[] = []

      while (
        i < siblings.length &&
        isGroupableListType((siblings[i] as any).type as string)
      ) {
        const candidate = siblings[i]
        if (((candidate as any).type as string) !== listType) break
        items.push(candidate)
        i += 1
      }

      result.push({ kind: "list_group", listType, items })
      continue
    }

    result.push(current)
    i += 1
  }
  return result
}

export type ContentRawNode = { block: ContentBlockRaw; depth: number }

export function mapRawBlocksWithDepth(
  blocks: ContentBlockRaw[],
  depth: number = 0
): ContentRawNode[] {
  const result: ContentRawNode[] = []

  for (const block of blocks) {
    result.push({ block, depth })
    const children = (block as any).children as ContentBlockRaw[] | undefined
    if (children && children.length) {
      result.push(...mapRawBlocksWithDepth(children, depth + 1))
    }
  }

  return result
}

export function walkRawBlocks(
  blocks: ContentBlockRaw[],
  visitor: (block: ContentBlockRaw, depth: number) => void,
  depth: number = 0
): void {
  for (const block of blocks) {
    visitor(block, depth)
    const children = (block as any).children as ContentBlockRaw[] | undefined
    if (children && children.length) {
      walkRawBlocks(children, visitor, depth + 1)
    }
  }
}
