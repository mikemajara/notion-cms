import { PropertyItemObjectResponse } from "@notionhq/client/build/src/api-endpoints"

// TODO: This seems to be deprecated or unused.
// check please.
export type NotionPropertyType =
  | "title"
  | "rich_text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "people"
  | "files"
  | "checkbox"
  | "url"
  | "email"
  | "phone_number"
  | "formula"
  | "relation"
  | "rollup"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by"
  | "status"
  | "unique_id"
  | "button"

export interface DatabaseRecord {
  id: string
}

export type NotionProperty = PropertyItemObjectResponse
