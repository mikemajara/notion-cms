#!/usr/bin/env node

const { Client } = require("@notionhq/client")

const token = process.env.NOTION_TOKEN
const databaseId = process.env.NOTION_DATABASE_ID
const notionVersion = process.env.NOTION_VERSION

if (!token) {
  console.error("Missing NOTION_TOKEN environment variable")
  process.exit(1)
}

if (!databaseId) {
  console.error("Missing NOTION_DATABASE_ID environment variable")
  process.exit(1)
}

const clientOptions = { auth: token }
if (notionVersion) {
  clientOptions.notionVersion = notionVersion
}

const notion = new Client(clientOptions)

async function main() {
  try {
    const response = await notion.databases.retrieve({
      database_id: databaseId
    })

    console.log("\n=== Full database response ===")
    console.log(JSON.stringify(response, null, 2))

    console.log("\n=== Extracted keys ===")
    const { properties, data_sources: dataSources, ...rest } = response
    console.log(
      JSON.stringify(
        {
          hasProperties: properties ? true : false,
          propertyKeys: properties ? Object.keys(properties) : null,
          dataSources,
          parent: rest.parent,
          object: rest.object,
          id: rest.id
        },
        null,
        2
      )
    )
  } catch (error) {
    console.error("Failed to retrieve database schema:", error)
    process.exit(1)
  }
}

main()

