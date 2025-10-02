We're iterating on our current design again.

We found while experimenting that, while the layer API is great, it is a bit inflexible in the way the methods are implemented. Some of the methods like blocksToMarkdown are shipped inconsistently accross the code, the new structure we want to migrate to is one where

1. there is an index.ts file that exposes any types, classes, or methods that will be publicly available to anyone using the code
   1. Currently the index.ts holds the definition for the NotionCMS, so that needs to be changed. There will be a new file (renaming is fine) which will contain the NotionCMS definition
2. The NotionCMS will contain and expose the methods and classes that actually depend on the client, those that are retrieving the data from the official @notionhq/client API.
3. The layered API will now have a different structure:
   1. Our api, will provide basic functions like getRecord or getContent to fetch the Raw blocks from the API conveniently (for example, using recursion by default for getContent so all children blocks for a page are retrieved in 1 call). 
   2. We will then provide users with block processors (contentProcessor, and recordProcessor), that will define methods to conveniently switch a Raw block into an Advanced block or to a Simple block.
   3. Currently the FileManager and mediaUrlResolver are used inconsistently: both the getContent and the getRecord files which retrieve the Raw blocks are the ones that should use the Filemanager to make the conversion happen during the first fetch we make to the API, making sure whatever caching strategy is used, is used throughout the 3 layers of the API.
   

This iteration will introduce breaking changes and that's fine. We don't want to keep old behavior since we're still in a development experimental phase.

The way I see it we should start by refactoring the indext.ts file, moving the NotionCMS definition to a client.ts, and then exporting anything that needs to be public in the index.ts file. Once that is done, we should be able to start renaming and reviewing the rest of the code.

Your current tasks are to (1) share your thoughts on this new refactor (2) challenge the approach listing pros and cons of the current approach vs our new one and (3) plan the first task.

## Notes from pre-refactor `src/index.ts`
- Property helper utilities were intended to live inside `DatabaseService`; callers should use public database APIs instead of property utilities directly.
- `ContentConverter`, `BlockProcessor`, and `ContentProcessor` have no direct dependency on the Notion client; plan to ship them as standalone processors once layering is complete.
- FileManager instantiation inside `NotionCMS` is the single place to wire caching/media resolution across API layers.
- Legacy conversion helpers (`blocksToMarkdown`, `blocksToAdvanced`, `blocksToHtml`) were slated for removal after creating dedicated processors; advanced conversion needs consistent media URL resolution with `FileManager`.
- Query defaults should return Raw blocks; downstream conversion to Simple/Advanced is expected to happen via processors.
- Record/content fetchers must avoid duplicate network calls across layers; fetch raw once, then transform.
- `getPageContent` is a deprecated alias that should delegate to the raw fetch and be removed in the next major release.
- Generated database registry augments `NotionCMS.prototype.databases`; `registerDatabase` helper remains the extension point.

## Content-layer Refactor Plan (next phase)
- `PageContentService` currently fetches raw blocks via `getBlocksRaw` without invoking `FileManager`; individual conversions (e.g., `BlockProcessor.extractBlockContentAsync`) call `FileManager.processFileUrl` on demand.
- Markdown/HTML/Advanced converters rely on optional `mediaUrlResolver` functions rather than the centralized FileManager.
- Next steps:
  - Normalize raw block retrieval in `PageContentService` to run FileManager enrichment for files/media while fetching.
  - Introduce standalone block conversion helpers for Simple/Advanced layers (move logic out of service classes).
  - Centralize Markdown/HTML conversion around the new helpers; remove duplication in `BlockProcessor`/`ContentConverter`.
  - Update docs/examples to show fetch-raw + convert pattern for page content, mirroring record workflow.