This text is the extract where we discuss about the architecture for DatabaseRecord vs ContentBlock

I think it might make sense to keep ContentBlock in separate type definitions as that payload can significantly increase. However for large databases it would also increase the Datab

---

This is an extract of one of our last conversations. Please analyze it and gain context around the topic that's being discussed. For DatabaseRecord we curretnly ship our three layers of properties within the same item but we'd like to make this more lean so the user can request whichever kind they want DatabaseRecordSimple, DatabaseRecordAdvanced or DataBaseRecordRaw

"""

- Short answer: don’t ship both raw and advanced per node. Make Raw the transport default and derive Advanced only when explicitly requested.

Recommended approach with payload constraints
- Content blocks
  - Default: return a Raw tree only (BlockObjectResponse with children).
  - When Advanced is needed: return a single Advanced tree instead of pairing it with Raw.
  - If both Raw and Advanced must be available at once: include only one children hierarchy. e.g., keep `children` on the wrapper, but set `raw.children` and `advanced.children` to undefined to avoid duplication.
  - API shape:
    - getPageContent(pageId, { view: "raw" | "advanced" } = { view: "raw" })
    - blocksToMarkdown(blocksRaw)
    - blocksToHtml(blocksRaw)
  - Optional optimization: lazy/memoized Advanced build at the page level (not per-node) with a stable cache key of the Raw input (hash of block ids+timestamps).

- DatabaseRecord
  - Default: return minimal Simple (and id) only.
  - Add explicit switches to include larger views:
    - query(..., { include: "simple" | "advanced" | "raw" } = "simple")
    - getRecord(pageId, { include }) with the same contract.
  - Never embed both advanced + raw on each record by default; if both are requested, prefer returning them as parallel top-level views (recordSimple, recordAdvanced, recordRaw) or pick one and provide a reference to fetch the other on demand.

Pros
- Lower payloads by default; callers opt in to larger views.
- Clear mental model: one view per response unless explicitly requested.
- Easier caching (hash Raw → Advanced) and cheaper SSR/RPC boundaries.

Cons
- More option plumbing (include/view flags).
- Callers needing both views must make an explicit choice or an extra call.

If you want, I can implement:
- getPageContent(pageId, { view }).
- getRecord(pageId, { include }) and query(..., { include }).
- Strip duplicate children when both views are ever requested together.