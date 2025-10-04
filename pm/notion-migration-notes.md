# Notion API 2025-09-03 Migration Notes

## References

- [Upgrade Guide – 2025-09-03](https://developers.notion.com/docs/upgrade-guide-2025-09-03)
- [Upgrade FAQs – 2025-09-03](https://developers.notion.com/docs/upgrade-faqs-2025-09-03)

## Summary of Breaking Changes

- `database_id` is no longer sufficient for most database operations; calls must use the parent database to discover one or more `data_source_id`s before querying or creating pages.
- Database endpoints shift to data-source aware equivalents. Querying, schema reads, relations, and search now operate against data sources instead of the legacy single-source database abstraction.
- Webhooks and other payloads include the `data_source_id` to disambiguate which source generated an event.

## Impacted Areas in `@mikemajara/notion-cms`

- `packages/notion-cms/src/generator.ts` – relies on `database.properties` after `databases.retrieve`; needs data source discovery before generating schemas.
- `packages/notion-cms/src/database/database-service.ts` – issues `.databases.query({ database_id })`; must call data-source scoped query endpoint.
- `packages/notion-cms/src/database/query-builder.ts` – same `.databases.query` usage; internal state should store `data_source_id`.
- `packages/notion-cms/src/client.ts` – registry currently stores `databaseId` only; needs to propagate `data_source_id` for QueryBuilder initialization.
- `packages/notion-cms/src/cli.ts` – CLI options accept database IDs; must add discovery/prompting for data sources and support multi-source generation.
- Generated type registry (`registerDatabase` usage) – expects single database per key; needs schema for multiple data sources under same database.

## Migration Tasks and Status

1. **Flag hotspots with TODO comments** – In progress. TODO markers inserted in generator, database service, query builder, client, and CLI to track database→data-source migrations.
2. **Spec out plan** – This document establishes scope, references, and pending changes for the migration.
3. **CLI & generator updates** – Pending. Implement data source discovery, selection, and generation, maintaining backwards compatibility during transition.
4. **Query layer refactor** – Pending. Replace `.databases.query` usage, store `data_source_id`, adjust logging, provide compatibility for existing consumers.
5. **Registry & multi-source ergonomics** – Pending. Allow multiple data sources per logical database key, ensure generated code registers them.
6. **Webhooks/search/relations audit** – Pending. Document follow-up requirements for data-source aware webhook payloads, relation writes, and search responses.

## Open Questions / Follow-ups

- Determine how to surface multiple data sources in the CLI (auto-generate unique keys vs. prompt user-defined aliases).
- Confirm SDK support for `notion.dataSources.retrieve`; otherwise use manual REST calls.
- Establish migration strategy for downstream projects consuming generated registry keys (potential breaking change).
