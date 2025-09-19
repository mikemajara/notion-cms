import {
  PropertyItemObjectResponse,
  SelectPropertyItemObjectResponse,
  MultiSelectPropertyItemObjectResponse,
  DatePropertyItemObjectResponse,
  PeoplePropertyItemObjectResponse,
  FilesPropertyItemObjectResponse,
  CheckboxPropertyItemObjectResponse,
  NumberPropertyItemObjectResponse,
  RelationPropertyItemObjectResponse,
  RollupPropertyItemObjectResponse,
  CreatedTimePropertyItemObjectResponse,
  CreatedByPropertyItemObjectResponse,
  LastEditedTimePropertyItemObjectResponse,
  LastEditedByPropertyItemObjectResponse,
  TitlePropertyItemObjectResponse,
  RichTextPropertyItemObjectResponse,
  UrlPropertyItemObjectResponse,
  EmailPropertyItemObjectResponse,
  PhoneNumberPropertyItemObjectResponse,
  UserObjectResponse,
  UniqueIdPropertyItemObjectResponse
} from "@notionhq/client/build/src/api-endpoints"
import { FileManager } from "../../file-processor/file-manager"

export async function getPropertyValueSimple(
  property: PropertyItemObjectResponse,
  fileManager: FileManager
): Promise<any> {
  switch (property.type) {
    case "unique_id": {
      const idProp = property as UniqueIdPropertyItemObjectResponse
      return idProp.unique_id.number
    }
    case "title": {
      const titleProp = property as TitlePropertyItemObjectResponse
      const richText = titleProp.title as unknown as Array<{
        plain_text: string
      }>
      return richText?.[0]?.plain_text ?? ""
    }
    case "rich_text": {
      const richTextProp = property as RichTextPropertyItemObjectResponse
      const richText = richTextProp.rich_text as unknown as Array<{
        plain_text: string
      }>
      return richText?.[0]?.plain_text ?? ""
    }
    case "number":
      return (property as NumberPropertyItemObjectResponse).number
    case "select":
      return (property as SelectPropertyItemObjectResponse).select?.name ?? null
    case "multi_select":
      return (
        property as MultiSelectPropertyItemObjectResponse
      ).multi_select.map((select) => select.name)
    case "date": {
      const dateProp = property as DatePropertyItemObjectResponse
      return dateProp.date ? new Date(dateProp.date.start) : null
    }
    case "people": {
      const peopleProp = property as PeoplePropertyItemObjectResponse
      return Array.isArray(peopleProp.people)
        ? peopleProp.people.map(
            (person: UserObjectResponse) => person.name || ""
          )
        : []
    }
    case "files": {
      const filesProp = property as FilesPropertyItemObjectResponse
      const files = filesProp.files.map((file) => {
        if (file.type === "external") {
          return { name: file.name, url: file.external.url }
        } else if (file.type === "file") {
          return { name: file.name, url: file.file.url }
        } else {
          return { name: file.name, url: "" }
        }
      })

      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const processedUrl = await fileManager.processFileUrl(
            file.url,
            file.name
          )
          return {
            ...file,
            url: processedUrl
          }
        })
      )

      return processedFiles
    }
    case "checkbox":
      return (property as CheckboxPropertyItemObjectResponse).checkbox
    case "url":
      return (property as UrlPropertyItemObjectResponse).url
    case "email":
      return (property as EmailPropertyItemObjectResponse).email
    case "phone_number":
      return (property as PhoneNumberPropertyItemObjectResponse).phone_number
    case "formula":
      return (property as any).formula
    case "relation": {
      const relationProp = property as RelationPropertyItemObjectResponse
      return Array.isArray(relationProp.relation)
        ? relationProp.relation.map((rel: { id: string }) => rel.id)
        : []
    }
    case "rollup":
      return (property as RollupPropertyItemObjectResponse).rollup
    case "created_time":
      return (property as CreatedTimePropertyItemObjectResponse).created_time
    case "created_by": {
      const createdBy = (property as CreatedByPropertyItemObjectResponse)
        .created_by as UserObjectResponse
      return {
        id: createdBy.id,
        name: createdBy.name,
        avatar_url: createdBy.avatar_url
      }
    }
    case "last_edited_time":
      return (property as LastEditedTimePropertyItemObjectResponse)
        .last_edited_time
    case "last_edited_by": {
      const lastEditedBy = (property as LastEditedByPropertyItemObjectResponse)
        .last_edited_by as UserObjectResponse
      return {
        id: lastEditedBy.id,
        name: lastEditedBy.name,
        avatar_url: lastEditedBy.avatar_url
      }
    }
    default:
      return null
  }
}
