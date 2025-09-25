import type {
  DatabaseObjectResponse,
  PageObjectResponse
} from "@notionhq/client/build/src/api-endpoints"

export type NotionDatabaseObject = DatabaseObjectResponse
export type NotionPageObject = PageObjectResponse
export type NotionPropertyTypeBase =
  DatabaseObjectResponse["properties"][string]["type"]

