## Notion API 2025-09-03 Migration Plan (Minimal)

### Summary
- Notion introduced multi-source databases; most database operations must use `data_source_id` instead of `database_id`.
- Our library currently queries via `database_id` and pins `@notionhq/client` v2, so it can break if a database gains multiple data sources.
- Goal: minimally adapt internals to resolve and use `data_source_id`, upgrade SDK, and keep the public API stable.

Reference: Notion Upgrade Guide `2025-09-03` — https://developers.notion.com/docs/upgrade-guide-2025-09-03#what-this-guide-covers

### Impacted Areas (current usage)
- Client init: `new Client({ auth })` without `notionVersion`.
- Reads: `client.databases.query({ database_id })` in `DatabaseService` and `QueryBuilder`.
- Type generation: `databases.retrieve({ database_id })` (OK to keep) and generated registry stores only `databaseId`.
- Tests/fixtures: expect `parent.type = "database_id"` and database-level query mocks.
- We do not create pages, write relations, use Search, or webhooks at runtime.

### Out of Scope (for minimal plan)
- Blocks/markdown, files pipeline, and S3 logic (unchanged).
- Adding runtime Search or webhooks.

---

## Implementation Steps

### 1) Upgrade SDK and set API version
- Bump peer dependency in `packages/notion-cms/package.json`:
  - `@notionhq/client`: `^5.0.0`
- Initialize client with version:
  - `new Client({ auth: token, notionVersion: "2025-09-03" })`

### 2) Add data source discovery and selection
- Add an internal utility `resolveDataSourceId(databaseId: string, selector?: DataSourceSelector): Promise<string>`
  - Calls `client.databases.retrieve({ database_id })` (SDK v5) and reads `data_sources: Array<{ id, name }>`.
  - Selection:
    - If exactly one, use it.
    - If multiple, use `selector` if provided, else try env mapping `NOTION_CMS_<KEY>_DATA_SOURCE_ID`, else first entry and log a warning.
  - Cache in-memory (keyed by `databaseId`) with a TTL (e.g., 10 minutes) to avoid repeated fetches.
- Config surface:
  - Optional `dataSourceSelector?: (databaseId: string, dataSources: { id: string; name: string }[]) => string`.
  - Optional `dataSourceOverrides?: Record<string, string>` where key is databaseId or logical key.

### 3) Migrate queries to data sources
- Replace all `client.databases.query({ database_id, ... })` with `client.dataSources.query({ data_source_id, ... })`.
- `DatabaseService.getDatabase` and `QueryBuilder`:
  - Before querying, call `resolveDataSourceId(databaseId)` and pass the result as `data_source_id`.
  - Maintain existing filter/sort/pagination semantics.
  - Update debug logs to include `data_source_id`.

### 4) Generated types and registry updates
- Generator still retrieves schema via `databases.retrieve({ database_id })`.
- During generation, also capture the selected `data_source_id` (per Step 2) and write it into the emitted registry entry:
  - Augment generated registry object to include `dataSourceId` alongside `id` (databaseId).
  - Allow override via env: `NOTION_CMS_<KEY>_DATA_SOURCE_ID`.
- `NotionCMS.query(<key>)` should prefer `dataSourceId` if present; otherwise will call `resolveDataSourceId(id)` at runtime.

### 5) Optional surfaces (documented, not implemented now)
- Page creation: if added later, parent must be `{ type: "data_source_id", data_source_id }`.
- Relation writes: provide `data_source_id` instead of `database_id`.
- Search: when introduced, handle `object: "data_source"` results and potential multiple results per database.

### 6) Tests and fixtures
- Update mocks to expect `dataSources.query({ data_source_id, ... })`.
- Keep schema retrieval mocks via `databases.retrieve` (now including `data_sources`).
- Adjust fixtures that assert `parent: { type: "database_id" }` — keep for reading, but add new cases for pages whose parent includes `data_source_id` where relevant.
- Add tests for multi-source selection logic: single source, named selection, env override, fallback to first with warning.

### 7) Rollout and compatibility
- Backward compatibility: public API continues to accept database IDs; library resolves to `data_source_id` internally.
- For multi-source databases, recommend setting `NOTION_CMS_<KEY>_DATA_SOURCE_ID` or providing a `dataSourceSelector`.
- Versioning: release a minor version if the public API is unchanged; otherwise bump major if any type surface changes are required.

### 8) Validation checklist
- Build, lint, types, tests:
  - `pnpm install`
  - `pnpm --filter @mikemajara/notion-cms lint`
  - `pnpm --filter @mikemajara/notion-cms check-types`
  - `pnpm --filter @mikemajara/notion-cms build`
  - `pnpm --filter @mikemajara/notion-cms test`
- Real workspace smoke test (single-source DB): verify queries still return records.
- Multi-source manual test: add a second data source in Notion, set the env override, verify correct results per selected source.

### Risks
- Multi-source selection ambiguity without a selector or override.
- Consumers depending on test fixtures referencing `database_id` shapes may need minor updates.

### Estimated effort
- Core library changes: 0.5–1.5 days.
- Generator and tests: 0.5–1 day.
- Total: ~1–2.5 days including validation.

### References
- Notion Upgrade Guide 2025-09-03: https://developers.notion.com/docs/upgrade-guide-2025-09-03#what-this-guide-covers

