import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import type { DatabaseRecordType } from "../types/public"
import type { FileManager } from "../file-processor/file-manager"
import { getPropertyValueSimple } from "./database-record-converter/converter-record-simple"
import { getPropertyValueAdvanced } from "./database-record-converter/converter-record-advanced"

type ConvertRecordOptions = {
  fileManager?: FileManager
}

export async function convertRecord(
  page: PageObjectResponse,
  recordType: DatabaseRecordType,
  options: ConvertRecordOptions = {}
) {
  switch (recordType) {
    case "simple":
      return convertRecordToSimple(page, options.fileManager)
    case "advanced":
      return convertRecordToAdvanced(page, options.fileManager)
    default:
      return page
  }
}

export async function convertRecordToSimple(
  page: PageObjectResponse,
  fileManager?: FileManager
) {
  const simple: Record<string, any> = { id: page.id }

  await Promise.all(
    Object.entries(page.properties).map(async ([key, value]) => {
      simple[key] = await getPropertyValueSimple(value as any, fileManager)
    })
  )

  return simple
}

export async function convertRecordToAdvanced(
  page: PageObjectResponse,
  fileManager?: FileManager
) {
  const advanced: Record<string, any> = { id: page.id }

  await Promise.all(
    Object.entries(page.properties).map(async ([key, value]) => {
      advanced[key] = await getPropertyValueAdvanced(value as any, fileManager)
    })
  )

  return advanced
}

export async function convertRecords(
  pages: PageObjectResponse[],
  recordType: DatabaseRecordType,
  options: ConvertRecordOptions = {}
) {
  return Promise.all(
    pages.map((page) => convertRecord(page, recordType, options))
  )
}
