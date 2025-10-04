import {
  DatabaseObjectResponse,
  DataSourceObjectResponse
} from "@notionhq/client/build/src/api-endpoints"
import * as fs from "fs"
import * as path from "path"
import { Project, SourceFile } from "ts-morph"
import { getClient } from "./shared"

// Use runtime type to avoid redefining in generator
import type { NotionPropertyType } from "./types/public"
type NotionPropertyConfig = DataSourceObjectResponse["properties"][string]

type NotionPropertyEntries = Array<[string, NotionPropertyConfig]>
type DataSourceReference = DatabaseObjectResponse["data_sources"][number]

type DataSourceSelection = {
  dataSource: DataSourceObjectResponse
  compositeName: string
  commentLabel: string
  databaseName: string
  dataSourceName: string | null
}

function deriveDatabaseDisplayName(
  database: DatabaseObjectResponse,
  databaseId: string
): string {
  let databaseName = "NotionDatabase"
  const databaseResponse = database as unknown as {
    title?: Array<{ plain_text?: string }>
  }

  if (
    databaseResponse.title &&
    Array.isArray(databaseResponse.title) &&
    databaseResponse.title.length > 0
  ) {
    const plainText = databaseResponse.title[0].plain_text
    if (plainText) {
      databaseName = plainText
    }
  }

  if (databaseName === "NotionDatabase") {
    databaseName = databaseId.replace(/-/g, "").substring(0, 12)
  }

  return databaseName
}

function buildCompositeName(
  baseName: string,
  dataSourceName?: string | null
): string {
  if (!dataSourceName) {
    return baseName
  }
  return `${baseName} ${dataSourceName}`.trim()
}

async function fetchDataSource(
  notion: ReturnType<typeof getClient>,
  dataSourceId: string
): Promise<DataSourceObjectResponse> {
  return (await notion.dataSources.retrieve({
    data_source_id: dataSourceId
  })) as DataSourceObjectResponse
}

async function resolveDataSources(
  notion: ReturnType<typeof getClient>,
  database: DatabaseObjectResponse,
  databaseId: string
): Promise<DataSourceSelection[]> {
  const baseName = deriveDatabaseDisplayName(database, databaseId)
  const references = database.data_sources ?? []

  if (references.length === 0) {
    throw new Error(
      `[generator] Database ${databaseId} does not expose any data sources. Generation requires at least one data source.`
    )
  }

  const selections: DataSourceSelection[] = []

  for (const ref of references) {
    const dataSource = await fetchDataSource(notion, ref.id)
    const firstTitleFragment = dataSource.title?.find((fragment) =>
      fragment.plain_text?.trim()
    )
    const dataSourceName = firstTitleFragment?.plain_text ?? ref.name ?? null
    const compositeName = buildCompositeName(baseName, dataSourceName)
    const commentLabel = dataSourceName
      ? `${baseName} (Data source: ${dataSourceName})`
      : baseName

    selections.push({
      dataSource,
      compositeName,
      commentLabel,
      databaseName: baseName,
      dataSourceName
    })
  }

  return selections
}

// DatabaseRecord types are only needed at runtime; not required in generator

// Helper function to sanitize property names
function sanitizePropertyName(name: string): string {
  // Check if the property name needs to be enclosed in quotes
  return /[^a-zA-Z0-9_$]/.test(name) ? `"${name}"` : name
}

const propertyTypeToTS = (
  propertyType: NotionPropertyType,
  propertyConfig?: NotionPropertyConfig
): string => {
  switch (propertyType) {
    case "title":
    case "rich_text":
    case "url":
    case "email":
    case "phone_number":
      return "string"
    case "number":
      return "number"
    case "select":
      // Extract options from select config if available
      if (
        propertyConfig &&
        "select" in propertyConfig &&
        propertyConfig.select &&
        "options" in propertyConfig.select &&
        Array.isArray(propertyConfig.select.options) &&
        propertyConfig.select.options.length > 0
      ) {
        return propertyConfig.select.options
          .map((option: { name: string }) => `"${option.name}"`)
          .join(" | ")
      }
      return "string"
    case "multi_select":
      // For multi_select, we'll return an array of the union type
      if (
        propertyConfig &&
        "multi_select" in propertyConfig &&
        propertyConfig.multi_select &&
        "options" in propertyConfig.multi_select &&
        Array.isArray(propertyConfig.multi_select.options) &&
        propertyConfig.multi_select.options.length > 0
      ) {
        const optionsUnion = propertyConfig.multi_select.options
          .map((option: { name: string }) => `"${option.name}"`)
          .join(" | ")
        return `Array<${optionsUnion}>`
      }
      return "string[]"
    case "date":
      return "Date"
    case "people":
      return "string[]"
    case "files":
      return "{ name: string; url: string; }[]"
    case "checkbox":
      return "boolean"
    case "formula":
      return "any" // This could be refined based on formula type
    case "relation":
      return "string[]" // Array of related page IDs
    case "rollup":
      return "any" // This could be refined based on rollup type
    case "created_time":
    case "last_edited_time":
      return "string"
    case "created_by":
    case "last_edited_by":
      return "{ id: string; name: string | null; avatar_url: string | null; }"
    default:
      return "any"
  }
}

// Helper function to generate a valid TypeScript type name from database name
function generateTypeName(name: string): string {
  // Remove non-alphanumeric characters, convert to PascalCase
  const cleanName = name
    .replace(/[^\w\s]/g, "")
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/\s/g, "")

  // Ensure first character is uppercase and prepend Record prefix
  return "Record" + cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
}

// Generate a valid file name for a database
function generateFileName(databaseName: string): string {
  // Use the database name to create a slug for the filename
  const nameSlug = databaseName
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-")

  return `notion-types-${nameSlug}.ts`
}

function extractPropertyEntries(
  properties: DataSourceObjectResponse["properties"] | undefined,
  context: { databaseId: string; databaseName: string }
): NotionPropertyEntries {
  if (!properties || typeof properties !== "object") {
    console.error(
      `[generator] Invalid properties received for database ${context.databaseName} (${context.databaseId}).`,
      { properties }
    )
    throw new Error(
      "Notion database response does not include a valid properties object."
    )
  }

  const entries: NotionPropertyEntries = []

  for (const [propertyName, propertyValue] of Object.entries(properties)) {
    if (
      !propertyValue ||
      typeof propertyValue !== "object" ||
      !("type" in propertyValue) ||
      typeof (propertyValue as { type?: unknown }).type !== "string"
    ) {
      console.warn(
        `[generator] Skipping property "${propertyName}" for database ${context.databaseName} (${context.databaseId}) because it is missing a valid type.`,
        { property: propertyValue }
      )
      continue
    }

    entries.push([propertyName, propertyValue as NotionPropertyConfig])
  }

  if (entries.length === 0) {
    console.error(
      `[generator] No usable properties found for database ${context.databaseName} (${context.databaseId}).`,
      { properties }
    )
    throw new Error(
      "Unable to generate types because no usable properties were found in the Notion schema response."
    )
  }

  return entries
}

export async function generateTypes(
  databaseId: string,
  outputPath: string,
  token: string,
  options?: { dataSourceId?: string }
): Promise<void> {
  // Create a new notion client with the provided token
  const notion = getClient(token)

  const database = (await notion.databases.retrieve({
    database_id: databaseId
  })) as DatabaseObjectResponse

  const selections = await resolveDataSources(notion, database, databaseId)

  const selection = options?.dataSourceId
    ? selections.find((item) => item.dataSource.id === options.dataSourceId)
    : selections[0]

  if (!selection) {
    const available = selections
      .map(
        (item) => `${item.dataSourceName ?? "Unnamed"} (${item.dataSource.id})`
      )
      .join(", ")
    throw new Error(
      `[generator] Data source "${options?.dataSourceId}" not found. Available sources: ${available}`
    )
  }

  const properties = selection.dataSource.properties

  // Extract database name and convert to a proper type name
  const compositeName = selection.compositeName
  const databaseName = selection.databaseName

  const typeName = generateTypeName(compositeName)

  // Generate filename for this database
  const fileName = generateFileName(compositeName)

  // Create output directory if it doesn't exist
  fs.mkdirSync(outputPath, { recursive: true })

  // Generate the database-specific file
  const specificFilePath = path.join(outputPath, fileName)

  // Initialize ts-morph project
  const project = new Project()
  const sourceFile = project.createSourceFile(
    specificFilePath,
    "",
    { overwrite: true } // Database-specific files are always overwritten
  )

  // Generate database-specific types file that imports directly from notion-cms
  generateDatabaseSpecificFile(
    sourceFile,
    properties,
    typeName,
    selection.commentLabel,
    databaseId,
    selection.dataSource.id,
    databaseName
  )

  // Save the file
  await sourceFile.save()

  // Also generate an index file that exports everything from generated files
  updateIndexFile(outputPath, fileName)
}

// Create or update an index file that exports from all generated type files
function updateIndexFile(outputPath: string, fileName: string): void {
  const indexPath = path.join(outputPath, "index.ts")

  // Create new index file if it doesn't exist
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(
      indexPath,
      `// Auto-generated index file for Notion CMS types

// Export database-specific types
`
    )
  }

  // Read current content
  // let content = fs.readFileSync(indexPath, "utf8")
  let content = `// Auto-generated index file for Notion CMS types

// Export database-specific types
`

  // Check if this file is already exported
  let exportLine = `import './${fileName.replace(".ts", "")}';\n`
  exportLine += `export * from './${fileName.replace(".ts", "")}';`
  if (!content.includes(exportLine)) {
    // Add export if not already there
    content += `${exportLine}\n`
    fs.writeFileSync(indexPath, content)
  }
}

// Generate database-specific types with registry approach
function generateDatabaseSpecificFile(
  sourceFile: SourceFile,
  properties: DataSourceObjectResponse["properties"],
  typeName: string,
  compositeName: string,
  databaseId: string,
  dataSourceId: string,
  databaseName: string
): void {
  try {
    const propertyEntries = extractPropertyEntries(properties, {
      databaseId,
      databaseName: compositeName
    })

    // Add a comment at the top of the file warning that it's auto-generated
    sourceFile.addStatements(`/**
 * THIS FILE IS AUTO-GENERATED BY NOTION-CMS
 * DO NOT EDIT DIRECTLY - YOUR CHANGES WILL BE OVERWRITTEN
 * v0.1.3
 * Generated for database: ${databaseName}
 * Composite name: ${compositeName}
 * Data source: ${dataSourceId ?? "<default>"}
 */`)

    // Add imports directly from notion-cms
    sourceFile.addImportDeclaration({
      moduleSpecifier: "@mikemajara/notion-cms",
      namedImports: ["DatabaseRecord", "NotionCMS", "DatabaseFieldMetadata"]
    })
    // Import PageObjectResponse for raw typing in registry
    sourceFile.addImportDeclaration({
      moduleSpecifier: "@notionhq/client/build/src/api-endpoints",
      namedImports: ["PageObjectResponse"]
    })

    sourceFile.addExportDeclaration({
      moduleSpecifier: "@mikemajara/notion-cms",
      namedExports: ["NotionCMS"]
    })

    // Helper function to determine advanced property type mapping
    const advancedPropertyTypeToTS = (
      propertyType: NotionPropertyType
    ): string => {
      switch (propertyType) {
        case "title":
          return "{ content: string; annotations: any; href: string | null; link?: { url: string } | null }[]"
        case "rich_text":
          return "{ content: string; annotations: any; href: string | null; link?: { url: string } | null }[]"
        case "number":
          return "number"
        case "select":
          return "{ id: string; name: string; color: string } | null"
        case "multi_select":
          return "{ id: string; name: string; color: string }[]"
        case "date":
          return "{ start: string; end: string | null; time_zone: string | null; parsedStart: Date | null; parsedEnd: Date | null } | null"
        case "people":
          return "{ id: string; name: string | null; avatar_url: string | null; object: string; type: string; email?: string }[]"
        case "files":
          return "{ name: string; type: string; external?: { url: string }; file?: { url: string; expiry_time: string } }[]"
        case "checkbox":
          return "boolean"
        case "url":
          return "string"
        case "email":
          return "string"
        case "phone_number":
          return "string"
        case "formula":
          return "{ type: string; value: any }"
        case "relation":
          return "{ id: string }[]"
        case "rollup":
          return "{ type: string; function: string; array?: any[]; number?: number; date?: any }"
        case "created_time":
          return "{ timestamp: string; date: Date }"
        case "created_by":
        case "last_edited_by":
          return "{ id: string; name: string | null; avatar_url: string | null; object: string; type: string; email?: string }"
        case "last_edited_time":
          return "{ timestamp: string; date: Date }"
        case "status":
          return "{ id: string; name: string; color: string } | null"
        case "unique_id":
          return "{ prefix: string | null; number: number }"
        default:
          return "any"
      }
    }

    // Generate metadata for field types
    const metadataStatements: string[] = []
    metadataStatements.push(`export const ${typeName}FieldTypes = {`)

    // Add the native Notion page ID first
    metadataStatements.push(`  "id": { type: "unique_id" },`)

    for (const [propertyName, propertyValue] of propertyEntries) {
      // For select and multi_select, add options data
      if (
        propertyValue.type === "select" ||
        propertyValue.type === "multi_select"
      ) {
        const optionsSource =
          propertyValue.type === "select"
            ? propertyValue.select?.options
            : propertyValue.multi_select?.options

        const options = (optionsSource ?? [])
          .map((option: { name: string }) => `"${option.name}"`)
          .join(", ")

        if (options.length === 0) {
          console.warn(
            `[generator] Property "${propertyName}" in database ${databaseName} (${databaseId}) declares type ${propertyValue.type} but contains no options. Falling back to empty options array.`,
            { property: propertyValue }
          )
        }

        metadataStatements.push(`  "${propertyName}": { 
    type: "${propertyValue.type}",
    options: [${options}] as const
  },`)
      } else {
        metadataStatements.push(
          `  "${propertyName}": { type: "${propertyValue.type}" },`
        )
      }
    }

    metadataStatements.push(`} as const satisfies DatabaseFieldMetadata;`)

    sourceFile.addStatements(metadataStatements.join("\n"))

    // First, generate the advanced record interface
    const baseTypeName = typeName
    const advancedTypeName = `${baseTypeName}Advanced`
    const rawTypeName = `${baseTypeName}Raw`

    sourceFile.addInterface({
      name: advancedTypeName,
      properties: [
        {
          name: "id",
          type: "string"
        },
        ...propertyEntries.map(([name, prop]) => ({
          name: sanitizePropertyName(name),
          type: advancedPropertyTypeToTS(prop.type)
        }))
      ],
      isExported: true
    })

    // Generate the raw record interface (kept for backwards reference if needed)
    sourceFile.addInterface({
      name: rawTypeName,
      properties: [
        { name: "id", type: "string" },
        { name: "properties", type: "Record<string, any>" }
      ],
      isExported: true
    })

    // Generate the database-specific type (Simple view only)
    sourceFile.addInterface({
      name: baseTypeName,
      extends: ["DatabaseRecord"],
      properties: [
        {
          name: "id",
          type: "string"
        },
        ...propertyEntries.map(([name, prop]) => ({
          name: sanitizePropertyName(name),
          type: propertyTypeToTS(prop.type, prop)
        }))
      ],
      isExported: true
    })

    // Generate camelCase database key from database name
    const databaseKey = compositeName
      .replace(/[^\w\s]/g, "")
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/\s/g, "")
      .replace(/^./, (c) => c.toLowerCase()) // Start with lowercase for registry key

    // Generate DatabaseRegistry interface extension and configuration
    sourceFile.addStatements(`
// Extend DatabaseRegistry interface with this database
declare module "@mikemajara/notion-cms" {
  interface DatabaseRegistry {
    ${databaseKey}: {
      record: ${typeName};
      recordAdvanced: ${advancedTypeName};
      recordRaw: PageObjectResponse;
      fields: typeof ${typeName}FieldTypes;
    };
  }
}

// Add database configuration to the registry
NotionCMS.prototype.databases["${databaseKey}"] = {
  id: process.env.NOTION_CMS_${databaseKey.toUpperCase()}_DATABASE_ID || "${databaseId}",
  ${
    dataSourceId
      ? `dataSourceId: process.env.NOTION_CMS_${databaseKey.toUpperCase()}_DATA_SOURCE_ID || "${dataSourceId}",`
      : `// dataSourceId: process.env.NOTION_CMS_${databaseKey.toUpperCase()}_DATA_SOURCE_ID || "${databaseId}",`
  }
  fields: ${typeName}FieldTypes,
};
`)
  } catch (error) {
    console.error("Error generating database-specific types:", error)
  }
}

/**
 * Generate types for multiple databases in a single file
 * @param databaseIds Array of database IDs to generate types for
 * @param outputPath Path where to generate the types file
 * @param token Notion API token
 * @param force Whether to force overwrite existing files
 */
export async function generateMultipleDatabaseTypes(
  databaseIds: string[],
  outputPath: string,
  token: string,
  options?: { dataSources?: Record<string, string> }
): Promise<void> {
  // Create a new notion client with the provided token
  const notion = getClient(token)

  const combinedFileName = "notion-types-combined.ts"
  const combinedFilePath = path.join(outputPath, combinedFileName)

  // Always overwrite combined file

  // Initialize ts-morph project
  const project = new Project()
  const sourceFile = project.createSourceFile(combinedFilePath, "", {
    overwrite: true
  })

  // Add header comment
  sourceFile.addStatements(`/**
 * THIS FILE IS AUTO-GENERATED BY NOTION-CMS
 * DO NOT EDIT DIRECTLY - YOUR CHANGES WILL BE OVERWRITTEN
 * 
 * Generated for multiple databases: ${databaseIds.join(", ")}
 */`)

  // Add imports
  sourceFile.addImportDeclaration({
    moduleSpecifier: "@mikemajara/notion-cms",
    namedImports: ["DatabaseRecord", "NotionCMS", "DatabaseFieldMetadata"]
  })

  // Track method names to avoid conflicts
  const methodNames: string[] = []

  // Generate types for each database
  for (const databaseId of databaseIds) {
    try {
      console.log(`Processing database: ${databaseId}`)

      const database = (await notion.databases.retrieve({
        database_id: databaseId
      })) as DatabaseObjectResponse

      const selections = await resolveDataSources(notion, database, databaseId)
      const selectionMap = new Map<string, DataSourceSelection>()
      selections.forEach((entry) => {
        selectionMap.set(entry.dataSource.id, entry)
      })

      const selection = options?.dataSources?.[databaseId]
        ? selectionMap.get(options.dataSources[databaseId])
        : undefined

      const targets = selection ? [selection] : selections

      for (const target of targets) {
        if (!target) {
          continue
        }

        const properties = target.dataSource.properties
        const compositeName = target.compositeName
        const databaseName = target.databaseName

        const typeName = generateTypeName(compositeName)
        const propertyEntries = extractPropertyEntries(properties, {
          databaseId,
          databaseName: compositeName
        })

        // Generate method name and ensure uniqueness
        let methodName = `query${compositeName
          .replace(/[^\w\s]/g, "")
          .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
          .replace(/\s/g, "")
          .replace(/^./, (c) => c.toUpperCase())}`

        let counter = 1
        const originalMethodName = methodName
        while (methodNames.includes(methodName)) {
          methodName = `${originalMethodName}${counter}`
          counter++
        }
        methodNames.push(methodName)

        sourceFile.addStatements(`
// ============================================================================
// ${compositeName} Database Types
// ============================================================================
`)

        sourceFile.addStatements(`export const ${typeName}FieldTypes = {`)
        sourceFile.addStatements(`  "id": { type: "string" },`)

        for (const [propertyName, propertyValue] of propertyEntries) {
          if (
            propertyValue.type === "select" ||
            propertyValue.type === "multi_select"
          ) {
            const optionsSource =
              propertyValue.type === "select"
                ? propertyValue.select?.options
                : propertyValue.multi_select?.options

            const options = (optionsSource ?? [])
              .map((option: { name: string }) => `"${option.name}"`)
              .join(", ")

            if (options.length === 0) {
              console.warn(
                `[generator] Property "${propertyName}" in database ${databaseName} (${databaseId}) declares type ${propertyValue.type} but contains no options. Falling back to empty options array.`,
                { property: propertyValue }
              )
            }

            sourceFile.addStatements(`  "${propertyName}": { 
    type: "${propertyValue.type}",
    options: [${options}] as const
  },`)
          } else {
            sourceFile.addStatements(
              `  "${propertyName}": { type: "${propertyValue.type}" },`
            )
          }
        }
        sourceFile.addStatements(`} as const satisfies DatabaseFieldMetadata;`)

        const advancedPropertyTypeToTS = (
          propertyType: NotionPropertyType
        ): string => {
          switch (propertyType) {
            case "title":
              return "{ content: string; annotations: any; href: string | null; link?: { url: string } | null }[]"
            case "rich_text":
              return "{ content: string; annotations: any; href: string | null; link?: { url: string } | null }[]"
            case "number":
              return "number"
            case "select":
              return "{ id: string; name: string; color: string } | null"
            case "multi_select":
              return "{ id: string; name: string; color: string }[]"
            case "date":
              return "{ start: string; end: string | null; time_zone: string | null; parsedStart: Date | null; parsedEnd: Date | null } | null"
            case "people":
              return "{ id: string; name: string | null; avatar_url: string | null; object: string; type: string; email?: string }[]"
            case "files":
              return "{ name: string; type: string; external?: { url: string }; file?: { url: string; expiry_time: string } }[]"
            case "checkbox":
              return "boolean"
            case "url":
              return "string"
            case "email":
              return "string"
            case "phone_number":
              return "string"
            case "formula":
              return "{ type: string; value: any }"
            case "relation":
              return "{ id: string }[]"
            case "rollup":
              return "{ type: string; function: string; array?: any[]; number?: number; date?: any }"
            case "created_time":
              return "{ timestamp: string; date: Date }"
            case "created_by":
            case "last_edited_by":
              return "{ id: string; name: string | null; avatar_url: string | null; object: string; type: string; email?: string }"
            case "last_edited_time":
              return "{ timestamp: string; date: Date }"
            case "status":
              return "{ id: string; name: string; color: string } | null"
            case "unique_id":
              return "{ prefix: string | null; number: number }"
            default:
              return "any"
          }
        }

        const baseTypeName = typeName
        const advancedTypeName = `${baseTypeName}Advanced`
        const rawTypeName = `${baseTypeName}Raw`

        sourceFile.addInterface({
          name: advancedTypeName,
          properties: [
            { name: "id", type: "string" },
            ...propertyEntries.map(([name, prop]) => ({
              name: sanitizePropertyName(name),
              type: advancedPropertyTypeToTS(prop.type)
            }))
          ],
          isExported: true
        })

        sourceFile.addInterface({
          name: rawTypeName,
          properties: [
            { name: "id", type: "string" },
            { name: "properties", type: "Record<string, any>" }
          ],
          isExported: true
        })

        sourceFile.addInterface({
          name: baseTypeName,
          extends: ["DatabaseRecord"],
          properties: [
            { name: "id", type: "string" },
            ...propertyEntries.map(([name, prop]) => ({
              name: sanitizePropertyName(name),
              type: propertyTypeToTS(prop.type, prop)
            })),
            { name: "advanced", type: advancedTypeName },
            { name: "raw", type: rawTypeName }
          ],
          isExported: true
        })

        const databaseKey = compositeName
          .replace(/[^\w\s]/g, "")
          .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
          .replace(/\s/g, "")
          .replace(/^./, (c) => c.toLowerCase())

        sourceFile.addStatements(`
// Extend DatabaseRegistry interface with this data source
declare module "@mikemajara/notion-cms" {
  interface DatabaseRegistry {
    ${databaseKey}: {
      record: ${typeName};
      recordAdvanced: ${advancedTypeName};
      recordRaw: PageObjectResponse;
      fields: typeof ${typeName}FieldTypes;
    };
  }
}

// Add data source configuration to the registry
NotionCMS.prototype.databases["${databaseKey}"] = {
  id: process.env.NOTION_CMS_${databaseKey.toUpperCase()}_DATABASE_ID || "${databaseId}",
  dataSourceId: process.env.NOTION_CMS_${databaseKey.toUpperCase()}_DATA_SOURCE_ID || "${
          target.dataSource.id
        }",
  fields: ${typeName}FieldTypes,
};
`)
      }
    } catch (error) {
      console.error(`Error processing database ${databaseId}:`, error)
    }
  }

  await sourceFile.save()
  console.log(`Generated combined types file: ${combinedFilePath}`)
}
