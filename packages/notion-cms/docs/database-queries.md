# Database Queries

This guide covers fetching database records through `NotionCMS.query()` and the `QueryBuilder`. It assumes you already registered your databases (see `configuration.md`).

## Query basics

```ts
const posts = await notion.query("blog").all()
```

- `query("blog")` resolves the database ID and field metadata registered via the generator.
- The builder returns a Promise-like object; awaiting it runs the query immediately.

### Fetching raw IDs

```ts
const posts = await notion
  .query("blog", { recordType: "raw" })
  .limit(10)
```

Passing `{ recordType: "raw" }` returns unmodified `PageObjectResponse`s.

## Record layers

| Layer              | Description                                                                                                                 | Helper functions                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `simple` (default) | Flat JS objects with scalar-friendly values. Dates become `Date`, relations become ID arrays, files return `{ name, url }`. | `convertRecordToSimple`, `convertRecords`   |
| `advanced`         | Rich metadata: annotations, select colours, people profiles, rollup/function detail, file expiry.                           | `convertRecordToAdvanced`, `convertRecords` |
| `raw`              | Original Notion payloads.                                                                                                   | Not applicable                              |

Switch layers per query:

```ts
const advancedPosts = await notion
  .query("blog", { recordType: "advanced" })
  .filter("Status", "equals", "Published")
```

## Filtering

Filters are validated against registered metadata. Invalid operators throw helpful errors.

```ts
const posts = await notion
  .query("blog")
  .filter("Title", "contains", "Guide")
  .filter("PublishedAt", "on_or_after", new Date("2025-01-01"))
```

- Date fields accept `Date` or ISO8601 strings; they are converted under the hood.
- `multi_select` `contains`/`does_not_contain` accept a single option value.

## Sorting

```ts
const posts = await notion
  .query("blog")
  .sort("PublishedAt", "descending")
  .sort("Title", "ascending")
```

- Attempting to sort on an unknown field throws an error listing valid fields.

## Pagination

```ts
const page = await notion
  .query("blog")
  .limit(10)
  .paginate()

const nextPage = await notion
  .query("blog")
  .startAfter(page.nextCursor!)
  .limit(10)
  .paginate()
```

- `paginate(pageSize)` returns `{ results, hasMore, nextCursor }`.
- `startAfter(cursor)` resumes after a previous page.
- `all()` loops internally, fetching every page until `hasMore` is false.

## Single record helpers

```ts
const post = await notion
  .query("blog")
  .filter("Slug", "equals", "hello-world")
  .single()
```

- `single()` expects exactly one record; zero or many results throw errors.
- `maybeSingle()` returns the first record or `null`.

## Mixing raw IDs

If you did not register metadata, pass a Notion database ID directly:

```ts
const posts = await notion
  .query("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
  .filter("Status", "equals", "Published")
```

- Filtering still works, but you lose type safety and operator validation.
- Consider manually providing a minimal `fields` map even without the generator.

## Converting after the fact

`convertRecords` transforms raw arrays obtained elsewhere:

```ts
import { convertRecords } from "@originui/notion-cms"

const rawPages = await notion.databaseService.getAllDatabaseRecords(dbId)
const simple = await convertRecords(rawPages, "simple", {
  fileManager: notion["fileManager"] // internal, avoid in userland
})
```

Prefer using the QueryBuilder unless you have custom batching requirements.
