import {
  PropertyItemObjectResponse,
  NumberPropertyItemObjectResponse,
  SelectPropertyItemObjectResponse,
  MultiSelectPropertyItemObjectResponse,
  DatePropertyItemObjectResponse,
  PeoplePropertyItemObjectResponse,
  FilesPropertyItemObjectResponse,
  CheckboxPropertyItemObjectResponse,
  UrlPropertyItemObjectResponse,
  EmailPropertyItemObjectResponse,
  PhoneNumberPropertyItemObjectResponse,
  FormulaPropertyItemObjectResponse,
  RelationPropertyItemObjectResponse,
  RollupPropertyItemObjectResponse,
  CreatedTimePropertyItemObjectResponse,
  CreatedByPropertyItemObjectResponse,
  LastEditedTimePropertyItemObjectResponse,
  LastEditedByPropertyItemObjectResponse,
  TitlePropertyItemObjectResponse,
  RichTextPropertyItemObjectResponse,
  UserObjectResponse
} from "@notionhq/client/build/src/api-endpoints"
import type { FileManager } from "../../file-processor/file-manager"

export async function getPropertyValueAdvanced(
  property: PropertyItemObjectResponse,
  fileManager?: FileManager
): Promise<any> {
  switch (property.type) {
    case "title": {
      const titleProp = property as TitlePropertyItemObjectResponse
      if (!Array.isArray(titleProp.title)) {
        return []
      }
      return titleProp.title.map((item) => ({
        content: item.plain_text,
        annotations: item.annotations,
        href: item.href,
        ...(item.type === "text" && { link: item.text.link })
      }))
    }
    case "rich_text": {
      const richTextProp = property as RichTextPropertyItemObjectResponse
      if (!Array.isArray(richTextProp.rich_text)) {
        return []
      }
      return richTextProp.rich_text.map((item) => ({
        content: item.plain_text,
        annotations: item.annotations,
        href: item.href,
        ...(item.type === "text" && { link: item.text.link })
      }))
    }
    case "number":
      return (property as NumberPropertyItemObjectResponse).number
    case "select": {
      const selectProp = (property as SelectPropertyItemObjectResponse).select
      return selectProp
        ? { id: selectProp.id, name: selectProp.name, color: selectProp.color }
        : null
    }
    case "multi_select": {
      const multiSelectProp = (
        property as MultiSelectPropertyItemObjectResponse
      ).multi_select
      return multiSelectProp.map((select) => ({
        id: select.id,
        name: select.name,
        color: select.color
      }))
    }
    case "date": {
      const dateProp = property as DatePropertyItemObjectResponse
      if (!dateProp.date) return null
      return {
        start: dateProp.date.start,
        end: dateProp.date.end,
        time_zone: dateProp.date.time_zone,
        parsedStart: dateProp.date.start ? new Date(dateProp.date.start) : null,
        parsedEnd: dateProp.date.end ? new Date(dateProp.date.end) : null
      }
    }
    case "people": {
      const peopleProp = property as PeoplePropertyItemObjectResponse
      return Array.isArray(peopleProp.people)
        ? peopleProp.people.map((person: UserObjectResponse) => ({
            id: person.id,
            name: person.name,
            avatar_url: person.avatar_url,
            object: person.object,
            type: person.type,
            ...(person.type === "person" &&
              person.person && {
                email: person.person.email
              })
          }))
        : []
    }
    case "files": {
      const filesProp = property as FilesPropertyItemObjectResponse
      const files = filesProp.files.map((file) => {
        if (file.type === "external") {
          return {
            name: file.name,
            type: file.type,
            external: { url: file.external.url }
          }
        } else if (file.type === "file") {
          return {
            name: file.name,
            type: file.type,
            file: { url: file.file.url, expiry_time: file.file.expiry_time }
          }
        } else {
          return { name: file.name, type: file.type }
        }
      })

      if (!fileManager) {
        return files
      }

      return Promise.all(
        files.map(async (file) => {
          const originalUrl =
            file.type === "external" ? file.external?.url : file.file?.url
          if (originalUrl) {
            const processedUrl = await fileManager.processFileUrl(
              originalUrl,
              file.name
            )
            if (file.type === "external" && file.external) {
              file.external.url = processedUrl
            } else if (file.type === "file" && file.file) {
              file.file.url = processedUrl
            }
          }
          return file
        })
      )
    }
    case "checkbox":
      return (property as CheckboxPropertyItemObjectResponse).checkbox
    case "url":
      return (property as UrlPropertyItemObjectResponse).url
    case "email":
      return (property as EmailPropertyItemObjectResponse).email
    case "phone_number":
      return (property as PhoneNumberPropertyItemObjectResponse).phone_number
    case "formula": {
      const formulaProp = (property as FormulaPropertyItemObjectResponse)
        .formula
      return {
        type: formulaProp.type,
        value:
          formulaProp.type === "string"
            ? formulaProp.string
            : formulaProp.type === "number"
            ? formulaProp.number
            : formulaProp.type === "boolean"
            ? formulaProp.boolean
            : formulaProp.type === "date"
            ? formulaProp.date
            : null
      }
    }
    case "relation": {
      const relationProp = property as RelationPropertyItemObjectResponse
      return Array.isArray(relationProp.relation)
        ? relationProp.relation.map((rel) => ({ id: rel.id }))
        : []
    }
    case "rollup": {
      const rollupProp = (property as RollupPropertyItemObjectResponse).rollup
      return {
        type: rollupProp.type,
        function: rollupProp.function,
        ...(rollupProp.type === "array" && { array: rollupProp.array }),
        ...(rollupProp.type === "number" && { number: rollupProp.number }),
        ...(rollupProp.type === "date" && { date: rollupProp.date })
      }
    }
    case "created_time":
      return {
        timestamp: (property as CreatedTimePropertyItemObjectResponse)
          .created_time,
        date: new Date(
          (property as CreatedTimePropertyItemObjectResponse).created_time
        )
      }
    case "created_by": {
      const createdBy = (property as CreatedByPropertyItemObjectResponse)
        .created_by as UserObjectResponse
      return {
        id: createdBy.id,
        name: createdBy.name,
        avatar_url: createdBy.avatar_url,
        object: createdBy.object,
        type: createdBy.type,
        ...(createdBy.type === "person" &&
          createdBy.person && {
            email: createdBy.person.email
          })
      }
    }
    case "last_edited_time":
      return {
        timestamp: (property as LastEditedTimePropertyItemObjectResponse)
          .last_edited_time,
        date: new Date(
          (
            property as LastEditedTimePropertyItemObjectResponse
          ).last_edited_time
        )
      }
    case "last_edited_by": {
      const lastEditedBy = (property as LastEditedByPropertyItemObjectResponse)
        .last_edited_by as UserObjectResponse
      return {
        id: lastEditedBy.id,
        name: lastEditedBy.name,
        avatar_url: lastEditedBy.avatar_url,
        object: lastEditedBy.object,
        type: lastEditedBy.type,
        ...(lastEditedBy.type === "person" &&
          lastEditedBy.person && {
            email: lastEditedBy.person.email
          })
      }
    }
    case "status": {
      const statusProp = (property as any).status
      return statusProp
        ? { id: statusProp.id, name: statusProp.name, color: statusProp.color }
        : null
    }
    case "unique_id": {
      const uniqueIdProp = (property as any).unique_id
      return uniqueIdProp
        ? { prefix: uniqueIdProp.prefix, number: uniqueIdProp.number }
        : null
    }
    default:
      return null
  }
}
