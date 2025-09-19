### Goal
- Keep Simple content blocks unchanged (plain strings/URLs).
- Use Raw Notion blocks as the single source of truth for conversions.
- Add a thin, flattened Advanced content layer (discriminated union) for DX.
- Refactor Markdown/HTML conversion to consume Raw blocks; reuse the same traversal/inline helpers to also build Advanced.

### Phase 0 — API decisions
- Keep current `blocksToMarkdown(SimpleBlock[])` as-is for compatibility; mark as deprecated in docs.
- Introduce new functions:
  - `rawBlocksToMarkdown(rawBlocks, options?)`
  - `rawBlocksToHtml(rawBlocks, options?)`
  - `rawBlocksToAdvanced(rawBlocks, options?)`
- Add a new fetch method returning nested Raw blocks: `getPageContentRaw(pageId, recursive=true)`.

### Phase 1 — Types
- Add `packages/notion-cms/src/content-types.ts`.
- Define Advanced layer as a discriminated union (no nested meta, variants per Notion block type; media split by type).

- Status: Implemented
  - Added `packages/notion-cms/src/content-types.ts` with `ContentBlockAdvanced` and `ContentTableRowAdvanced`.
  - Exported from `packages/notion-cms/src/index.ts`.
  - Type check and build succeeded for `@mikemajara/notion-cms`.

```ts
export type ContentBlockAdvanced =
  | { id: string; type: "paragraph" | "quote"; text: string; text_md: string; children?: ContentBlockAdvanced[] }
  | { id: string; type: "heading_1" | "heading_2" | "heading_3"; text: string; text_md: string }
  | { id: string; type: "bulleted_list_item" | "numbered_list_item" | "toggle"; text: string; text_md: string; children?: ContentBlockAdvanced[] }
  | { id: string; type: "to_do"; checked: boolean; text: string; text_md: string; children?: ContentBlockAdvanced[] }
  | { id: string; type: "code"; language: string; text: string; text_md: string }
  | { id: string; type: "bookmark" | "embed" | "link_preview"; url: string; caption_text?: string; caption_md?: string }
  | { id: string; type: "image" | "video" | "audio" | "file" | "pdf"; url: string; caption_text?: string; caption_md?: string; expiry_time?: string }
  | { id: string; type: "equation"; expression: string }
  | { id: string; type: "divider" }
  | { id: string; type: "table"; hasColumnHeader: boolean; hasRowHeader: boolean; rows: ContentTableRowAdvanced[] }
  | { id: string; type: "table_row"; cells: { text: string; text_md: string }[] }
  | { id: string; type: "columns"; children: { type: "column"; children: ContentBlockAdvanced[] }[] }
  | { id: string; type: "column"; children: ContentBlockAdvanced[] }
  | { id: string; type: "synced_block"; originalBlockId?: string; children?: ContentBlockAdvanced[] }
  | { id: string; type: "child_page"; title?: string; pageId: string }
  | { id: string; type: "child_database"; title?: string; databaseId: string }
  | { id: string; type: "breadcrumb" }
  | { id: string; type: "table_of_contents" }
  | { id: string; type: "template"; children?: ContentBlockAdvanced[] }

export type ContentTableRowAdvanced = Extract<ContentBlockAdvanced, { type: "table_row" }>
```

Naming aligns with repo rule: top-level term first (ContentBlockAdvanced).

### Phase 2 — Raw fetching
- Add `PageContentService.getPageContentRaw(pageId, recursive=true): Promise<BlockObjectResponse[]>`:
  - Same pagination loop as existing, but return Raw blocks.
  - If `recursive`, for each block with `has_children`, fetch children and attach `children` property (array of Raw blocks).

- Status: Implemented
  - Added `ContentBlockRaw` type in `packages/notion-cms/src/content-types.ts`.
  - Implemented `getPageContentRaw(pageId, recursive)` and `getBlocksRaw(blockId)` in `packages/notion-cms/src/page-content-service.ts`.
  - Exposed `getPageContentRaw` from `NotionCMS` in `packages/notion-cms/src/index.ts` and exported `ContentBlockRaw`.
  - Type check and build succeeded for `@mikemajara/notion-cms`.

### Phase 3 — Inline conversion utilities
- Add `richTextToPlain(rich: RichTextItemResponse[]): string`.
- Add `richTextToMarkdown(rich: RichTextItemResponse[]): string`.
  - Map: bold → **, italic → *, strikethrough → ~~, code → `, links → [text](url).
  - Ignore color/underline; leave mentions as text, link when possible.
- Add caption helpers using the same functions.

- Status: Implemented
  - Added `packages/notion-cms/src/utils/rich-text.ts` with `richTextToPlain` and `richTextToMarkdown`.
  - Exported helpers from `packages/notion-cms/src/index.ts`.
  - Type check and build succeeded for `@mikemajara/notion-cms`.

### Phase 4 — List traversal & grouping
- Implement a traversal that:
  - Walks Raw blocks depth-first using attached `children`.
  - Groups consecutive siblings of type `"bulleted_list_item"` or `"numbered_list_item"` into list groups.
  - Indentation level = recursion depth for list items.
  - Supports mixed lists by closing a group when type changes.
  - To do items render as list-like with `[ ]` or `[x]` but are not grouped with non-to_do items.

- Status: Implemented
  - Added `packages/notion-cms/src/utils/block-traversal.ts` with `groupConsecutiveListItems`, `mapRawBlocksWithDepth`, and `walkRawBlocks`.
  - Exported helpers from `packages/notion-cms/src/index.ts`.
  - Type check and build succeeded for `@mikemajara/notion-cms`.

### Phase 5 — Markdown conversion (Raw)
- `rawBlocksToMarkdown(rawBlocks, { listIndent = "  " })`:
  - Paragraph/quote/toggle/list items/to_do/headings: use `richTextToMarkdown`.
  - Code: fenced block with language; content from `richTextToPlain`.
  - Bookmark/embed/link_preview: URL on its own line; caption_md below (optional).
  - Media (image/video/audio/file/pdf): URL on its own line; caption_md below (optional).
  - Equation: `$${expression}$$` or `\[ ... ]` depending on chosen style.
  - Divider: `---`.
  - Table: render Markdown table:
    - Use first row as header when `hasColumnHeader`; otherwise generate default headers or omit.
  - Columns/child_page/child_database/breadcrumb/table_of_contents/template/synced_block:
    - Emit minimal placeholders or skip in Markdown; recurse into `children` where meaningful (columns/column/synced/template).

- Status: Implemented
  - Added `packages/notion-cms/src/raw-markdown.ts` with `rawBlocksToMarkdown`.
  - Uses traversal and `richTextToMarkdown` helpers; supports grouping and indentation.
  - Exported from `packages/notion-cms/src/index.ts`.
  - Type check and build succeeded for `@mikemajara/notion-cms`.

### Phase 6 — HTML conversion (Raw)
- `rawBlocksToHtml(rawBlocks, { classPrefix = "" })`:
  - Similar traversal as Markdown.
  - Add class names compatible with Notion color classes; when color annotations exist, map to classes like `${classPrefix}color-<name>`, `${classPrefix}bg-<name>`.
  - Media as appropriate tags (`img`, `video`, `audio`) when possible; otherwise links.
  - Lists: `<ul>`/`<ol>` nesting by depth; `<li>` content uses inline HTML converter for annotations.

- Status: Implemented
  - Added `packages/notion-cms/src/utils/rich-text.ts` `richTextToHtml` helper.
  - Added `packages/notion-cms/src/raw-html.ts` with `rawBlocksToHtml` using traversal and inline helpers.
  - Exported from `packages/notion-cms/src/index.ts`.
  - Type check and build succeeded for `@mikemajara/notion-cms`.

### Phase 7 — Advanced builder (derived from Raw)
- `rawBlocksToAdvanced(rawBlocks, options?)`:
  - Use the same traversal.
  - For each block type, produce the corresponding `ContentBlockAdvanced` variant:
    - text/text_md from rich_text helpers.
    - urls/media resolved (respect existing storage config for permanent URLs; fall back to Notion file URL).
    - captions converted to both plain and md.
    - code.language from Raw.
    - tables: produce `rows` with `cells: { text, text_md }[]`.
    - columns: normalize to `{ type: "columns", children: [{ type: "column", children }, ...] }`.

- Status: Implemented
  - Added `packages/notion-cms/src/raw-advanced.ts` with `rawBlocksToAdvanced`.
  - Supports media resolution hook via `mediaUrlResolver` option.
  - Exported from `packages/notion-cms/src/index.ts`.
  - Type check and build succeeded for `@mikemajara/notion-cms`.

### Phase 8 — Back-compat and migration
- Keep `ContentConverter.blocksToMarkdown(SimpleBlock[])` as-is for now.
- Add new public methods in `index.ts` for raw-based conversions and advanced builder.
- Docs: mark Simple-based Markdown as legacy; recommend Raw-based functions.

### Phase 9 — Edge cases and media resolution
- Storage config: add a resolver interface already used by FileManager; ensure media URLs are resolved once during Advanced building and HTML/MD conversion.
- Synced blocks: include `originalBlockId` when present; recurse into children.
- Mentions: person/page/database/date → render sensible plain text; link when a URL is present.

### Phase 10 — Testing
- Unit tests for `richTextToMarkdown` (cover combinations of annotations, links, mentions).
- Snapshot tests for nested lists (bulleted/numbered, mixed, multi-level).
- Tests for code blocks with language.
- Media/link/caption rendering tests.
- Table rendering tests (with/without headers).
- Integration test against a real Notion page fixture (if available).

### Phase 11 — Docs
- Add Advanced Content Blocks page explaining union variants with examples.
- Update “Content blocks” guide to show:
  - Fetch Raw → convert to Markdown/HTML.
  - Fetch Raw → convert to Advanced for DX use cases.
  - Keep Simple for trivial/plain use.

### Phase 12 — Incremental rollout
- Implement Phases 2–5 first (Raw fetch + Markdown), fixing list indentation bug immediately.
- Add HTML conversion and Advanced builder next.
- Update docs and deprecations last.

- Summary:
  - Advanced = flattened union variants per block type (no nested meta).
  - Conversions read Raw; helpers reused by Markdown/HTML/Advanced.
  - Simple unchanged.
  - Immediate win: correct inline formatting and list indentation.