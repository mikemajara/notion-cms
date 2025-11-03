import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"

export type NotionBlock = BlockObjectResponse & {
  children?: NotionBlock[]
}
