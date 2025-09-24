import type {
  DatabaseObjectResponse,
  PageObjectResponse
} from "@notionhq/client/build/src/api-endpoints"

// Shared runtime-only types (no ts-morph here)

export type DatabaseRecordType = "simple" | "advanced" | "raw"

export interface DatabaseRecord {
  id?: string
  [key: string]: any
}

export type DatabaseRecordRaw = PageObjectResponse

export type NotionPropertyType =
  DatabaseObjectResponse["properties"][string]["type"]
