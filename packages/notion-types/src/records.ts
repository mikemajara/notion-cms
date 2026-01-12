import type { NotionPageObject, NotionPropertyTypeBase } from "./notion"

export type DatabaseRecordType = "simple" | "advanced" | "raw"

export interface DatabaseRecord {
  id?: string
  [key: string]: any
}

export type DatabaseRecordRaw = NotionPageObject

export type NotionPropertyType = NotionPropertyTypeBase
