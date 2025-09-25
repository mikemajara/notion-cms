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