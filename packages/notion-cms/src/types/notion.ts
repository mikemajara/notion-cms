import type {
  DataSourceObjectResponse,
  PageObjectResponse
} from "@notionhq/client/build/src/api-endpoints"

export type NotionDataSourceObject = DataSourceObjectResponse
export type NotionPageObject = PageObjectResponse
export type NotionPropertyTypeBase =
  DataSourceObjectResponse["properties"][string]["type"]
