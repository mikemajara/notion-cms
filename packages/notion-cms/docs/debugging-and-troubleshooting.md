# Debugging & Troubleshooting

This guide outlines logging options, common errors, and ways to verify your configuration.

## Enable debug logging

```ts
const notion = new NotionCMS(token, {
  debug: {
    enabled: true,
    level: "debug"
  }
})
```

- `enabled`: global toggle.
- `level`: `"error" | "warn" | "info" | "debug"`.

Internally, the `debug` helper exposes:

- `debug.query(databaseId, payload)` – logs Notion query payloads.
- `debug.log(message, context?)` – general info statements.
- `debug.error(error, context?)` – errors with enriched metadata.

Set `level: "error"` in production to minimise noise.

## Common issues

### "Database \"blog\" not found in registry"

- Ensure the generated types file runs before calling `notion.query("blog")`.
- Check that `registerDatabase("blog", { id, fields })` uses the same key.
- If you bypass the generator, confirm you imported the manual registration.

### Invalid filter operator errors

- The QueryBuilder validates operators against `DatabaseFieldMetadata`.
- Regenerate types if you added new fields or options in Notion.
- For ad-hoc queries, use raw database IDs and provide correct operator/value pairs.

### Expired media URLs

- Notion-hosted files expire after a few hours.
- Use `local` or `remote` strategy to produce stable URLs.
- Ensure `FileManager` is passed to custom converters if you instantiate them manually.

### Missing S3 credentials

- Remote strategy requires `endpoint`, `accessKey`, and `secretKey`.
- Optional `bucket` defaults to `default-bucket`; override in production.
- Check environment variables are defined at runtime (serverless functions often need explicit configuration).

### Rate limiting / API errors

- Respect Notion’s rate limits (`429` responses). Implement retries with exponential backoff if needed (not provided by default).
- Inspect `debug.error` output; the thrown error retains Notion API details.

## Verify configuration

1. **Check logging**: With `level: "debug"`, see console output for queries and file processing.
2. **Inspect cache directory**: For local strategy, ensure files appear under `files.storage.path`.
3. **Confirm remote uploads**: Use your S3 dashboard or list objects to verify stored files.
4. **Test advanced records**: Fetch an `advanced` record and confirm select/people metadata is present.
5. **Render blocks**: Run `blocksToMarkdown` or `blocksToHtml` and ensure output matches expectations.

## Collecting diagnostics

When filing issues or debugging production problems, include:

- Notion CMS version (`package.json` or `pnpm list @originui/notion-cms`).
- Config snippet (`NotionCMSConfig`).
- Relevant Notion API response snippets (remove sensitive data).
- Logs from `debug.error` with context objects.

These details make reproducing issues far easier and speed up resolutions.
