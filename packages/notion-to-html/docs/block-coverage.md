<!-- HTML converter reference for supported Notion blocks -->

# Notion Block HTML Coverage

This document mirrors the current Markdown renderer features so the HTML
converter can reach parity quickly. It lists every block type handled by
`packages/notion-to-md/src/blocks-to-markdown.ts` and the intended HTML
output shape.

## Core inline helpers
- `richTextToHtml(richText)` → wraps annotations using `<strong>`, `<em>`, `<u>`, `<code>`, `<s>`, `<span data-color="…">`, and `<a>` tags while escaping inline text.
- `richTextToPlain(richText)` → mirrors the Markdown helper for cases such as code blocks where raw text is required.

Both helpers should accept raw `RichTextItemResponse[]` from the Notion SDK.

## Block rendering matrix

| Notion block type | HTML structure |
| --- | --- |
| `paragraph` | `<p>…rich text…</p>` with nested children appended directly afterward. |
| `toggle` | `<details><summary>…rich text…</summary><div>…children…</div></details>` |
| `quote` | `<blockquote>…rich text…children…</blockquote>` with child blocks rendered inside the `<blockquote>`. |
| `heading_1` | `<h1>…rich text…</h1>` |
| `heading_2` | `<h2>…rich text…</h2>` |
| `heading_3` | `<h3>…rich text…</h3>` |
| `code` | `<pre><code data-language="lang">…plain text…</code></pre>` preserving the `language` metadata. |
| `bookmark` / `embed` / `link_preview` | `<figure class="notion-media notion-{type}"><a href="url">…</a><figcaption>…caption…</figcaption></figure>` with the anchor label using the caption when provided (falling back to the raw URL). |
| `image` / `video` / `audio` / `file` / `pdf` | `<figure class="notion-media notion-{type}"><media-tag src="…" alt="caption text" /></figure>` selecting the appropriate media tag (`img`, `video`, `audio`, `object`). |
| `equation` | `<span data-notion-equation="expression">expression</span>` (placeholder until better math rendering is added). |
| `divider` | `<hr />` |
| `table` | `<table><thead>…</thead><tbody>…</tbody></table>` based on header metadata and row cell HTML conversion. |
| `column_list` / `columns` | Wrapper `<div class="notion-columns">` containing rendered children. |
| `column` | `<div class="notion-column">…children…</div>` |
| `synced_block` | Directly render child blocks (acts as a passthrough). |
| `bulleted_list_item` | `<ul class="notion-bulleted-list"><li>…</li></ul>` groups sequential items within the same list depth. |
| `numbered_list_item` | `<ol class="notion-numbered-list"><li>…</li></ol>` with deterministic numbering per contiguous group. |
| `to_do` | `<ul class="notion-todo-list"><li><input type="checkbox" checked disabled />…</li></ul>` preserving nested children inside each item. |
| `table_row` | Internal helper only; rendered inside parent table. |
| `child_page` / `child_database` / `breadcrumb` / `table_of_contents` | Respect the `debug` option by emitting `<div class="notion-debug-placeholder" data-kind="…">Title…</div>`; otherwise skip. |
| `template` | Render children directly. |

## Options matrix

| Option | Description | Default |
| --- | --- | --- |
| `debug` | Toggle structural placeholders for unsupported blocks (same behaviour as Markdown helper). | `false` |
| `listClassName` | Optional class added to `<ul>` / `<ol>` roots. | `undefined` |
| `todoClassName` | Optional class for the `<ul>` used by to-do lists. | `undefined` |
| `columnClassName` | Optional class injected into column wrappers. | `undefined` |

Additional styling hooks can be added iteratively as we discover needs, but
the initial release should stay minimal and reflect the Markdown package’s
ergonomics.

## Unsupported blocks

Any block type not listed above should resolve to an empty string unless
`debug` is enabled, in which case the placeholder helper described earlier
applies. This matches the current Markdown strategy and keeps the API
predictable.

