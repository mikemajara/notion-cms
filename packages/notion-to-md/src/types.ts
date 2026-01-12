import type { ContentBlockRaw } from "@notion-utils/types"

// TODO: We need to figure out a way to ship types
// given that rn the notion-cms is what holds the
// common code, some types are still stored there.
// We don't want to ship these if we don't need to
// the whole idea behind modularizing is that anyone
// can use @notion-utils/md without a dependency on
// the @notion-utils/cms package, and still get the
// output they want with that library and the use
// of @notionhq/client.

export type { ContentBlockRaw }

/**
 * @deprecated This is of new creation we should be using the ContentBlockRaw type instead
 */
export type NotionBlock = ContentBlockRaw
