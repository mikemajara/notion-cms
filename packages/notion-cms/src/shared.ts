import { Client } from "@notionhq/client"

export const getClient = (token: string) => {
  return new Client({
    auth: token,
    notionVersion: process.env.NOTION_VERSION || "2025-09-03"
  })
}
