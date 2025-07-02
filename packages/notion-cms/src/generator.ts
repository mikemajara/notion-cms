import { Client } from "@notionhq/client";
import {
  DatabaseObjectResponse,
  PropertyItemObjectResponse,
  RichTextItemResponse,
  SelectPropertyItemObjectResponse,
  MultiSelectPropertyItemObjectResponse,
  DatePropertyItemObjectResponse,
  PeoplePropertyItemObjectResponse,
  FilesPropertyItemObjectResponse,
  CheckboxPropertyItemObjectResponse,
  NumberPropertyItemObjectResponse,
  FormulaPropertyItemObjectResponse,
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
  PageObjectResponse,
  GetDatabaseResponse,
  UniqueIdPropertyItemObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import * as fs from "fs";
import * as path from "path";
import { Project, SourceFile } from "ts-morph";

// Define and export the NotionPropertyType
export type NotionPropertyType =
  DatabaseObjectResponse["properties"][string]["type"];
type NotionPropertyConfig = DatabaseObjectResponse["properties"][string];

// Export interfaces for use in other modules
export interface DatabaseRecord {
  // Make id optional to accommodate different naming conventions like 'ID'
  id?: string;
  [key: string]: any;
  // Instead of [key: string]: any, we'll use a specific property for advanced and raw
  advanced?: {
    id: string;
  };
  raw?: {
    id: string;
    properties: Record<string, any>;
  };
}

// We'll keep this interface for backward compatibility and type clarity
// but it will be effectively the same as DatabaseRecord now
export interface AdvancedDatabaseRecord extends DatabaseRecord {}

// Helper function to sanitize property names
function sanitizePropertyName(name: string): string {
  // Check if the property name needs to be enclosed in quotes
  return /[^a-zA-Z0-9_$]/.test(name) ? `"${name}"` : name;
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
      return "string";
    case "number":
      return "number";
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
          .join(" | ");
      }
      return "string";
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
          .join(" | ");
        return `Array<${optionsUnion}>`;
      }
      return "string[]";
    case "date":
      return "Date";
    case "people":
      return "string[]";
    case "files":
      return "{ name: string; url: string; }[]";
    case "checkbox":
      return "boolean";
    case "formula":
      return "any"; // This could be refined based on formula type
    case "relation":
      return "string[]"; // Array of related page IDs
    case "rollup":
      return "any"; // This could be refined based on rollup type
    case "created_time":
    case "last_edited_time":
      return "string";
    case "created_by":
    case "last_edited_by":
      return "{ id: string; name: string | null; avatar_url: string | null; }";
    default:
      return "any";
  }
};

// Helper function to generate a valid TypeScript type name from database name
function generateTypeName(name: string): string {
  // Remove non-alphanumeric characters, convert to PascalCase
  const cleanName = name
    .replace(/[^\w\s]/g, "")
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/\s/g, "");

  // Ensure first character is uppercase and prepend Record prefix
  return "Record" + cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
}

// Generate a valid file name for a database
function generateFileName(databaseName: string): string {
  // Use the database name to create a slug for the filename
  const nameSlug = databaseName
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-");

  return `notion-types-${nameSlug}.ts`;
}

export async function generateTypes(
  databaseId: string,
  outputPath: string,
  token: string,
  force: boolean = false
): Promise<void> {
  // Create a new notion client with the provided token
  const notion = new Client({
    auth: token,
  });

  // Fetch database schema
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const properties = database.properties;

  // Extract database name and convert to a proper type name
  let databaseName = "NotionDatabase";

  // Try to get a meaningful name for the database
  // Option 1: Use the actual database title from the API response
  // The type definition for GetDatabaseResponse might be incomplete
  // Use type assertion to access title property that exists in the actual API response
  const databaseResponse = database as unknown as {
    title?: Array<{ plain_text?: string }>;
  };

  if (
    databaseResponse.title &&
    Array.isArray(databaseResponse.title) &&
    databaseResponse.title.length > 0
  ) {
    const plainText = databaseResponse.title[0].plain_text;
    if (plainText) {
      databaseName = plainText;
    }
  }

  // Option 2: Fall back to database id if title is not available
  if (databaseName === "NotionDatabase") {
    databaseName = databaseId.replace(/-/g, "").substring(0, 12);

    // Option 3: Find the title property and use its name
    const titlePropertyName = Object.keys(properties).find(
      (key) => properties[key].type === "title"
    );

    if (titlePropertyName) {
      // The name of the title property is often descriptive of the content
      databaseName = titlePropertyName;
    }
  }

  const typeName = generateTypeName(databaseName);

  // Generate filename for this database
  const fileName = generateFileName(databaseName);

  // Create output directory if it doesn't exist
  fs.mkdirSync(outputPath, { recursive: true });

  // Generate the database-specific file
  const specificFilePath = path.join(outputPath, fileName);

  // Initialize ts-morph project
  const project = new Project();
  const sourceFile = project.createSourceFile(
    specificFilePath,
    "",
    { overwrite: true } // Database-specific files are always overwritten
  );

  // Generate database-specific types file that imports directly from notion-cms
  generateDatabaseSpecificFile(sourceFile, properties, typeName, databaseName);

  // Save the file
  await sourceFile.save();

  // Also generate an index file that exports everything from generated files
  updateIndexFile(outputPath, fileName);
}

// Create or update an index file that exports from all generated type files
function updateIndexFile(outputPath: string, fileName: string): void {
  const indexPath = path.join(outputPath, "index.ts");

  // Create new index file if it doesn't exist
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(
      indexPath,
      `// Auto-generated index file for Notion CMS types

// Export database-specific types
`
    );
  }

  // Read current content
  let content = fs.readFileSync(indexPath, "utf8");

  // Check if this file is already exported
  const exportLine = `export * from './${fileName.replace(".ts", "")}';`;
  if (!content.includes(exportLine)) {
    // Add export if not already there
    content += `${exportLine}\n`;
    fs.writeFileSync(indexPath, content);
  }
}

// Generate database-specific types that extend NotionCMS with database methods
function generateDatabaseSpecificFile(
  sourceFile: SourceFile,
  properties: DatabaseObjectResponse["properties"],
  typeName: string,
  databaseName: string
): void {
  try {
    // Add a comment at the top of the file warning that it's auto-generated
    sourceFile.addStatements(`/**
 * THIS FILE IS AUTO-GENERATED BY NOTION-CMS
 * DO NOT EDIT DIRECTLY - YOUR CHANGES WILL BE OVERWRITTEN
 * 
 * Generated for database: ${databaseName}
 */`);

    // Add imports directly from notion-cms
    sourceFile.addImportDeclaration({
      moduleSpecifier: "@mikemajara/notion-cms",
      namedImports: [
        "DatabaseRecord",
        "NotionCMS",
        "QueryBuilder",
        "DatabaseFieldMetadata",
      ],
    });

    // Helper function to determine advanced property type mapping
    const advancedPropertyTypeToTS = (
      propertyType: NotionPropertyType
    ): string => {
      switch (propertyType) {
        case "title":
          return "{ content: string; annotations: any; href: string | null; link?: { url: string } | null }[]";
        case "rich_text":
          return "{ content: string; annotations: any; href: string | null; link?: { url: string } | null }[]";
        case "number":
          return "number";
        case "select":
          return "{ id: string; name: string; color: string } | null";
        case "multi_select":
          return "{ id: string; name: string; color: string }[]";
        case "date":
          return "{ start: string; end: string | null; time_zone: string | null; parsedStart: Date | null; parsedEnd: Date | null } | null";
        case "people":
          return "{ id: string; name: string | null; avatar_url: string | null; object: string; type: string; email?: string }[]";
        case "files":
          return "{ name: string; type: string; external?: { url: string }; file?: { url: string; expiry_time: string } }[]";
        case "checkbox":
          return "boolean";
        case "url":
          return "string";
        case "email":
          return "string";
        case "phone_number":
          return "string";
        case "formula":
          return "{ type: string; value: any }";
        case "relation":
          return "{ id: string }[]";
        case "rollup":
          return "{ type: string; function: string; array?: any[]; number?: number; date?: any }";
        case "created_time":
          return "{ timestamp: string; date: Date }";
        case "created_by":
        case "last_edited_by":
          return "{ id: string; name: string | null; avatar_url: string | null; object: string; type: string; email?: string }";
        case "last_edited_time":
          return "{ timestamp: string; date: Date }";
        case "status":
          return "{ id: string; name: string; color: string } | null";
        case "unique_id":
          return "{ prefix: string | null; number: number }";
        default:
          return "any";
      }
    };

    // Generate metadata for field types
    const metadataStatements: string[] = [];
    metadataStatements.push(`export const ${typeName}FieldTypes = {`);

    // Add the native Notion page ID first
    metadataStatements.push(`  "id": { type: "unique_id" },`);

    for (const [propertyName, propertyValue] of Object.entries(properties)) {
      let fieldType: string;

      // For select and multi_select, add options data
      if (
        propertyValue.type === "select" ||
        propertyValue.type === "multi_select"
      ) {
        const options = (
          propertyValue.type === "select"
            ? propertyValue.select.options
            : propertyValue.multi_select.options
        )
          .map((option: { name: string }) => `"${option.name}"`)
          .join(", ");

        metadataStatements.push(`  "${propertyName}": { 
    type: "${propertyValue.type}",
    options: [${options}] as const
  },`);
      } else {
        metadataStatements.push(
          `  "${propertyName}": { type: "${propertyValue.type}" },`
        );
      }
    }

    metadataStatements.push(`} as const satisfies DatabaseFieldMetadata;`);

    sourceFile.addStatements(metadataStatements.join("\n"));

    // First, generate the advanced record interface
    const baseTypeName = typeName;
    const advancedTypeName = `${baseTypeName}Advanced`;
    const rawTypeName = `${baseTypeName}Raw`;

    sourceFile.addInterface({
      name: advancedTypeName,
      properties: [
        {
          name: "id",
          type: "string",
        },
        ...Object.entries(properties).map(([name, prop]) => ({
          name: sanitizePropertyName(name),
          type: advancedPropertyTypeToTS((prop as NotionPropertyConfig).type),
        })),
      ],
      isExported: true,
    });

    // Generate the raw record interface
    sourceFile.addInterface({
      name: rawTypeName,
      properties: [
        {
          name: "id",
          type: "string",
        },
        {
          name: "properties",
          type: "Record<string, any>",
        },
      ],
      isExported: true,
    });

    // Generate the database-specific type
    sourceFile.addInterface({
      name: baseTypeName,
      extends: ["DatabaseRecord"],
      properties: [
        {
          name: "id",
          type: "string",
        },
        ...Object.entries(properties).map(([name, prop]) => ({
          name: sanitizePropertyName(name),
          type: propertyTypeToTS(
            (prop as NotionPropertyConfig).type,
            prop as NotionPropertyConfig
          ),
        })),
        {
          name: "advanced",
          type: advancedTypeName,
        },
        {
          name: "raw",
          type: rawTypeName,
        },
      ],
      isExported: true,
    });

    // Generate camelCase method name from database name
    const methodName = `query${databaseName
      .replace(/[^\w\s]/g, "")
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/\s/g, "")
      .replace(/^./, (c) => c.toUpperCase())}`;

    // Generate module augmentation to extend NotionCMS class
    sourceFile.addStatements(`
// Extend NotionCMS class with database-specific method
/* eslint-disable */
declare module "@mikemajara/notion-cms" {
  interface NotionCMS {
    /**
     * Type-safe query method for the ${databaseName} database
     * @param databaseId The ID of the database to query
     * @returns A type-safe QueryBuilder for the ${typeName} record type
     */
    ${methodName}(databaseId: string): QueryBuilder<${typeName}, typeof ${typeName}FieldTypes>;
  }
}

// Implement the method on the NotionCMS prototype
NotionCMS.prototype.${methodName} = function(databaseId: string): QueryBuilder<${typeName}, typeof ${typeName}FieldTypes> {
  return this.query<${typeName}, typeof ${typeName}FieldTypes>(databaseId, ${typeName}FieldTypes);
};
`);
  } catch (error) {
    console.error("Error generating database-specific types:", error);
  }
}

/**
 * Process a Notion page into a record with layered access (simple, advanced, raw)
 * @param page The Notion page object from the API
 * @param fileManager Optional FileManager for file processing
 * @returns A processed record with simple, advanced, and raw access
 */
export function processNotionRecord(page: PageObjectResponse, fileManager?: any): DatabaseRecord {
  // Simple values (base level access)
  const simple: Record<string, any> = {
    id: page.id,
  };

  // More detailed but still processed values
  const advanced: Record<string, any> = {
    id: page.id,
  };

  // Process each property
  for (const [key, value] of Object.entries(page.properties)) {
    // Simple version (direct access)
    simple[key] = getPropertyValue(value as PropertyItemObjectResponse, fileManager);

    // Advanced version (detailed access)
    advanced[key] = getAdvancedPropertyValue(
      value as PropertyItemObjectResponse,
      fileManager
    );
  }

  // Construct unified record with all three access levels
  const result: DatabaseRecord = {
    id: page.id,
    ...simple,
    advanced: {
      id: page.id,
      ...advanced,
    },
    raw: {
      id: page.id,
      properties: page.properties,
    },
  };

  return result;
}

/**
 * Process multiple Notion pages into records with layered access
 * @param pages An array of Notion page objects
 * @returns An array of processed records with layered access
 */
export function processNotionRecords(
  pages: PageObjectResponse[],
  fileManager?: any
): DatabaseRecord[] {
  return pages.map((page) => processNotionRecord(page, fileManager));
}

/**
 * @deprecated Use processNotionRecord instead which provides advanced and raw access as well
 */
export function simplifyNotionRecord(page: PageObjectResponse): DatabaseRecord {
  return processNotionRecord(page);
}

/**
 * @deprecated Use processNotionRecords instead which provides advanced and raw access as well
 */
export function simplifyNotionRecords(
  pages: PageObjectResponse[]
): DatabaseRecord[] {
  return processNotionRecords(pages);
}

/**
 * @deprecated Use processNotionRecord instead which provides simplified, advanced and raw access
 */
export function advancedNotionRecord(
  page: PageObjectResponse
): AdvancedDatabaseRecord {
  return processNotionRecord(page) as AdvancedDatabaseRecord;
}

/**
 * @deprecated Use processNotionRecords instead which provides simplified, advanced and raw access
 */
export function advancedNotionRecords(
  pages: PageObjectResponse[]
): AdvancedDatabaseRecord[] {
  return processNotionRecords(pages) as AdvancedDatabaseRecord[];
}

// Export the helper function directly
export function getPropertyValue(property: PropertyItemObjectResponse, fileManager?: any): any {
  switch (property.type) {
    case "unique_id": {
      const idProp = property as UniqueIdPropertyItemObjectResponse;
      return idProp.unique_id.number;
    }
    case "title": {
      const titleProp = property as TitlePropertyItemObjectResponse;
      const richText = titleProp.title as unknown as Array<{
        plain_text: string;
      }>;
      return richText?.[0]?.plain_text ?? "";
    }
    case "rich_text": {
      const richTextProp = property as RichTextPropertyItemObjectResponse;
      const richText = richTextProp.rich_text as unknown as Array<{
        plain_text: string;
      }>;
      return richText?.[0]?.plain_text ?? "";
    }
    case "number":
      return (property as NumberPropertyItemObjectResponse).number;
    case "select":
      return (
        (property as SelectPropertyItemObjectResponse).select?.name ?? null
      );
    case "multi_select":
      return (
        property as MultiSelectPropertyItemObjectResponse
      ).multi_select.map((select) => select.name);
    case "date":
      const dateProp = property as DatePropertyItemObjectResponse;
      return dateProp.date ? new Date(dateProp.date.start) : null;
    case "people": {
      const peopleProp = property as PeoplePropertyItemObjectResponse;
      return Array.isArray(peopleProp.people)
        ? peopleProp.people.map(
            (person: UserObjectResponse) => person.name || ""
          )
        : [];
    }
    case "files": {
      const filesProp = property as FilesPropertyItemObjectResponse;
      const files = filesProp.files.map((file) => ({
        name: file.name,
        url: file.type === "external" ? file.external.url : (file as any).file.url,
      }));
      
      // If fileManager is available and using cache strategy, process files
      if (fileManager && fileManager.config?.files?.strategy === "cache") {
        // Note: Return promise for async processing - this changes the API to async
        // For now, return original files to maintain sync API, but log that caching is available
        console.log(`File caching is available for ${files.length} files but requires async processing`);
        return files;
      }
      
      return files;
    }
    case "checkbox":
      return (property as CheckboxPropertyItemObjectResponse).checkbox;
    case "url":
      return (property as UrlPropertyItemObjectResponse).url;
    case "email":
      return (property as EmailPropertyItemObjectResponse).email;
    case "phone_number":
      return (property as PhoneNumberPropertyItemObjectResponse).phone_number;
    case "formula":
      return (property as FormulaPropertyItemObjectResponse).formula;
    case "relation": {
      const relationProp = property as RelationPropertyItemObjectResponse;
      return Array.isArray(relationProp.relation)
        ? relationProp.relation.map((rel: { id: string }) => rel.id)
        : [];
    }
    case "rollup":
      return (property as RollupPropertyItemObjectResponse).rollup;
    case "created_time":
      return (property as CreatedTimePropertyItemObjectResponse).created_time;
    case "created_by": {
      const createdBy = (property as CreatedByPropertyItemObjectResponse)
        .created_by as UserObjectResponse;
      return {
        id: createdBy.id,
        name: createdBy.name,
        avatar_url: createdBy.avatar_url,
      };
    }
    case "last_edited_time":
      return (property as LastEditedTimePropertyItemObjectResponse)
        .last_edited_time;
    case "last_edited_by": {
      const lastEditedBy = (property as LastEditedByPropertyItemObjectResponse)
        .last_edited_by as UserObjectResponse;
      return {
        id: lastEditedBy.id,
        name: lastEditedBy.name,
        avatar_url: lastEditedBy.avatar_url,
      };
    }
    default:
      return null;
  }
}

// New function to get more detailed property values for the advanced layer
export function getAdvancedPropertyValue(
  property: PropertyItemObjectResponse,
  fileManager?: any
): any {
  switch (property.type) {
    case "title": {
      const titleProp = property as TitlePropertyItemObjectResponse;
      // Ensure we're working with an array of rich text items
      if (!Array.isArray(titleProp.title)) {
        return [];
      }
      // Return full rich text array with all formatting information
      return titleProp.title.map((item) => ({
        content: item.plain_text,
        annotations: item.annotations,
        href: item.href,
        ...(item.type === "text" && {
          link: item.text.link,
        }),
      }));
    }
    case "rich_text": {
      const richTextProp = property as RichTextPropertyItemObjectResponse;
      // Ensure we're working with an array of rich text items
      if (!Array.isArray(richTextProp.rich_text)) {
        return [];
      }
      // Return full rich text array with all formatting information
      return richTextProp.rich_text.map((item) => ({
        content: item.plain_text,
        annotations: item.annotations,
        href: item.href,
        ...(item.type === "text" && {
          link: item.text.link,
        }),
      }));
    }
    case "number":
      return (property as NumberPropertyItemObjectResponse).number;
    case "select": {
      const selectProp = (property as SelectPropertyItemObjectResponse).select;
      // Return full select object with id, name, and color
      return selectProp
        ? {
            id: selectProp.id,
            name: selectProp.name,
            color: selectProp.color,
          }
        : null;
    }
    case "multi_select": {
      const multiSelectProp = (
        property as MultiSelectPropertyItemObjectResponse
      ).multi_select;
      // Return array of full select objects with id, name, and color
      return multiSelectProp.map((select) => ({
        id: select.id,
        name: select.name,
        color: select.color,
      }));
    }
    case "date": {
      const dateProp = property as DatePropertyItemObjectResponse;
      if (!dateProp.date) return null;

      // Return complete date information including end date if available
      return {
        start: dateProp.date.start,
        end: dateProp.date.end,
        time_zone: dateProp.date.time_zone,
        // Also include a parsed Date object for convenience
        parsedStart: dateProp.date.start ? new Date(dateProp.date.start) : null,
        parsedEnd: dateProp.date.end ? new Date(dateProp.date.end) : null,
      };
    }
    case "people": {
      const peopleProp = property as PeoplePropertyItemObjectResponse;
      // Return more complete user information
      return Array.isArray(peopleProp.people)
        ? peopleProp.people.map((person: UserObjectResponse) => ({
            id: person.id,
            name: person.name,
            avatar_url: person.avatar_url,
            object: person.object,
            type: person.type,
            ...(person.type === "person" &&
              person.person && {
                email: person.person.email,
              }),
          }))
        : [];
    }
    case "files": {
      const filesProp = property as FilesPropertyItemObjectResponse;
      // Return more complete file information
      const files = filesProp.files.map((file) => ({
        name: file.name,
        type: file.type,
        ...(file.type === "external" && {
          external: {
            url: file.external.url,
          },
        }),
        ...(file.type === "file" && {
          file: {
            url: file.file.url,
            expiry_time: file.file.expiry_time,
          },
        }),
      }));
      
      // If fileManager is available and using cache strategy, process files
      if (fileManager && fileManager.config?.files?.strategy === "cache") {
        // Note: Return promise for async processing - this changes the API to async
        // For now, return original files to maintain sync API, but log that caching is available
        console.log(`Advanced file caching is available for ${files.length} files but requires async processing`);
        return files;
      }
      
      return files;
    }
    case "checkbox":
      return (property as CheckboxPropertyItemObjectResponse).checkbox;
    case "url":
      return (property as UrlPropertyItemObjectResponse).url;
    case "email":
      return (property as EmailPropertyItemObjectResponse).email;
    case "phone_number":
      return (property as PhoneNumberPropertyItemObjectResponse).phone_number;
    case "formula": {
      const formulaProp = (property as FormulaPropertyItemObjectResponse)
        .formula;
      // Return the complete formula result with type information
      return {
        type: formulaProp.type,
        // Safely access value based on type
        value:
          formulaProp.type === "string"
            ? formulaProp.string
            : formulaProp.type === "number"
            ? formulaProp.number
            : formulaProp.type === "boolean"
            ? formulaProp.boolean
            : formulaProp.type === "date"
            ? formulaProp.date
            : null,
      };
    }
    case "relation": {
      const relationProp = property as RelationPropertyItemObjectResponse;
      // Return complete relation information
      return Array.isArray(relationProp.relation)
        ? relationProp.relation.map((rel) => ({
            id: rel.id,
          }))
        : [];
    }
    case "rollup": {
      const rollupProp = (property as RollupPropertyItemObjectResponse).rollup;
      // Return the complete rollup with type information
      return {
        type: rollupProp.type,
        function: rollupProp.function,
        ...(rollupProp.type === "array" && {
          array: rollupProp.array,
        }),
        ...(rollupProp.type === "number" && {
          number: rollupProp.number,
        }),
        ...(rollupProp.type === "date" && {
          date: rollupProp.date,
        }),
      };
    }
    case "created_time":
      return {
        timestamp: (property as CreatedTimePropertyItemObjectResponse)
          .created_time,
        date: new Date(
          (property as CreatedTimePropertyItemObjectResponse).created_time
        ),
      };
    case "created_by": {
      const createdBy = (property as CreatedByPropertyItemObjectResponse)
        .created_by as UserObjectResponse;
      // Return more complete user information
      return {
        id: createdBy.id,
        name: createdBy.name,
        avatar_url: createdBy.avatar_url,
        object: createdBy.object,
        type: createdBy.type,
        ...(createdBy.type === "person" &&
          createdBy.person && {
            email: createdBy.person.email,
          }),
      };
    }
    case "last_edited_time":
      return {
        timestamp: (property as LastEditedTimePropertyItemObjectResponse)
          .last_edited_time,
        date: new Date(
          (
            property as LastEditedTimePropertyItemObjectResponse
          ).last_edited_time
        ),
      };
    case "last_edited_by": {
      const lastEditedBy = (property as LastEditedByPropertyItemObjectResponse)
        .last_edited_by as UserObjectResponse;
      // Return more complete user information
      return {
        id: lastEditedBy.id,
        name: lastEditedBy.name,
        avatar_url: lastEditedBy.avatar_url,
        object: lastEditedBy.object,
        type: lastEditedBy.type,
        ...(lastEditedBy.type === "person" &&
          lastEditedBy.person && {
            email: lastEditedBy.person.email,
          }),
      };
    }
    case "status": {
      const statusProp = (property as any).status;
      // Return full status object with id, name, and color
      return statusProp
        ? {
            id: statusProp.id,
            name: statusProp.name,
            color: statusProp.color,
          }
        : null;
    }
    case "unique_id": {
      const uniqueIdProp = (property as any).unique_id;
      // Return the unique ID object with prefix and number
      return uniqueIdProp
        ? {
            prefix: uniqueIdProp.prefix,
            number: uniqueIdProp.number,
          }
        : null;
    }
    default:
      return null;
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
  force: boolean = false
): Promise<void> {
  // Create a new notion client with the provided token
  const notion = new Client({
    auth: token,
  });

  const combinedFileName = "notion-types-combined.ts";
  const combinedFilePath = path.join(outputPath, combinedFileName);

  // Check if file exists and handle overwrite logic
  if (fs.existsSync(combinedFilePath) && !force) {
    // This would need a prompt, but for now we'll just warn
    console.warn(
      `File ${combinedFilePath} already exists. Use --force to overwrite.`
    );
    return;
  }

  // Initialize ts-morph project
  const project = new Project();
  const sourceFile = project.createSourceFile(combinedFilePath, "", {
    overwrite: true,
  });

  // Add header comment
  sourceFile.addStatements(`/**
 * THIS FILE IS AUTO-GENERATED BY NOTION-CMS
 * DO NOT EDIT DIRECTLY - YOUR CHANGES WILL BE OVERWRITTEN
 * 
 * Generated for multiple databases: ${databaseIds.join(", ")}
 */`);

  // Add imports
  sourceFile.addImportDeclaration({
    moduleSpecifier: "@mikemajara/notion-cms",
    namedImports: [
      "DatabaseRecord",
      "NotionCMS",
      "QueryBuilder",
      "DatabaseFieldMetadata",
    ],
  });

  // Track method names to avoid conflicts
  const methodNames: string[] = [];

  // Generate types for each database
  for (const databaseId of databaseIds) {
    try {
      console.log(`Processing database: ${databaseId}`);

      // Fetch database schema
      const database = await notion.databases.retrieve({
        database_id: databaseId,
      });
      const properties = database.properties;

      // Extract database name
      let databaseName = `Database${databaseId.substring(0, 8)}`;
      const databaseResponse = database as unknown as {
        title?: Array<{ plain_text?: string }>;
      };

      if (
        databaseResponse.title &&
        Array.isArray(databaseResponse.title) &&
        databaseResponse.title.length > 0
      ) {
        const plainText = databaseResponse.title[0].plain_text;
        if (plainText) {
          databaseName = plainText;
        }
      }

      const typeName = generateTypeName(databaseName);

      // Generate method name and ensure uniqueness
      let methodName = `query${databaseName
        .replace(/[^\w\s]/g, "")
        .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
        .replace(/\s/g, "")
        .replace(/^./, (c) => c.toUpperCase())}`;

      // Handle name conflicts
      let counter = 1;
      const originalMethodName = methodName;
      while (methodNames.includes(methodName)) {
        methodName = `${originalMethodName}${counter}`;
        counter++;
      }
      methodNames.push(methodName);

      // Add separator comment
      sourceFile.addStatements(`
// ============================================================================
// ${databaseName} Database Types
// ============================================================================
`);

      // Generate metadata for field types
      sourceFile.addStatements(`export const ${typeName}FieldTypes = {`);

      // Add the native Notion page ID first
      sourceFile.addStatements(`  "id": { type: "string" },`);

      for (const [propertyName, propertyValue] of Object.entries(properties)) {
        if (
          propertyValue.type === "select" ||
          propertyValue.type === "multi_select"
        ) {
          const options = (
            propertyValue.type === "select"
              ? propertyValue.select.options
              : propertyValue.multi_select.options
          )
            .map((option: { name: string }) => `"${option.name}"`)
            .join(", ");

          sourceFile.addStatements(`  "${propertyName}": { 
    type: "${propertyValue.type}",
    options: [${options}] as const
  },`);
        } else {
          sourceFile.addStatements(
            `  "${propertyName}": { type: "${propertyValue.type}" },`
          );
        }
      }
      sourceFile.addStatements(`} as const satisfies DatabaseFieldMetadata;`);

      // Generate advanced property type mapping function
      const advancedPropertyTypeToTS = (
        propertyType: NotionPropertyType
      ): string => {
        switch (propertyType) {
          case "title":
            return "{ content: string; annotations: any; href: string | null; link?: { url: string } | null }[]";
          case "rich_text":
            return "{ content: string; annotations: any; href: string | null; link?: { url: string } | null }[]";
          case "number":
            return "number";
          case "select":
            return "{ id: string; name: string; color: string } | null";
          case "multi_select":
            return "{ id: string; name: string; color: string }[]";
          case "date":
            return "{ start: string; end: string | null; time_zone: string | null; parsedStart: Date | null; parsedEnd: Date | null } | null";
          case "people":
            return "{ id: string; name: string | null; avatar_url: string | null; object: string; type: string; email?: string }[]";
          case "files":
            return "{ name: string; type: string; external?: { url: string }; file?: { url: string; expiry_time: string } }[]";
          case "checkbox":
            return "boolean";
          case "url":
            return "string";
          case "email":
            return "string";
          case "phone_number":
            return "string";
          case "formula":
            return "{ type: string; value: any }";
          case "relation":
            return "{ id: string }[]";
          case "rollup":
            return "{ type: string; function: string; array?: any[]; number?: number; date?: any }";
          case "created_time":
            return "{ timestamp: string; date: Date }";
          case "created_by":
          case "last_edited_by":
            return "{ id: string; name: string | null; avatar_url: string | null; object: string; type: string; email?: string }";
          case "last_edited_time":
            return "{ timestamp: string; date: Date }";
          case "status":
            return "{ id: string; name: string; color: string } | null";
          case "unique_id":
            return "{ prefix: string | null; number: number }";
          default:
            return "any";
        }
      };

      // Generate interface types
      const baseTypeName = typeName;
      const advancedTypeName = `${baseTypeName}Advanced`;
      const rawTypeName = `${baseTypeName}Raw`;

      sourceFile.addInterface({
        name: advancedTypeName,
        properties: [
          { name: "id", type: "string" },
          ...Object.entries(properties).map(([name, prop]) => ({
            name: sanitizePropertyName(name),
            type: advancedPropertyTypeToTS((prop as NotionPropertyConfig).type),
          })),
        ],
        isExported: true,
      });

      sourceFile.addInterface({
        name: rawTypeName,
        properties: [
          { name: "id", type: "string" },
          { name: "properties", type: "Record<string, any>" },
        ],
        isExported: true,
      });

      sourceFile.addInterface({
        name: baseTypeName,
        extends: ["DatabaseRecord"],
        properties: [
          { name: "id", type: "string" },
          ...Object.entries(properties).map(([name, prop]) => ({
            name: sanitizePropertyName(name),
            type: propertyTypeToTS(
              (prop as NotionPropertyConfig).type,
              prop as NotionPropertyConfig
            ),
          })),
          { name: "advanced", type: advancedTypeName },
          { name: "raw", type: rawTypeName },
        ],
        isExported: true,
      });
    } catch (error) {
      console.error(`Error processing database ${databaseId}:`, error);
    }
  }

  // Generate module augmentation with all method signatures
  sourceFile.addStatements(`
// ============================================================================
// NotionCMS Extension Methods
// ============================================================================

// Extend NotionCMS class with database-specific methods
/* eslint-disable */
declare module "@mikemajara/notion-cms" {
  interface NotionCMS {`);

  // Add method signatures for each database
  for (let i = 0; i < databaseIds.length; i++) {
    const databaseId = databaseIds[i];
    const methodName = methodNames[i];

    try {
      const database = await notion.databases.retrieve({
        database_id: databaseId,
      });
      let databaseName = `Database${databaseId.substring(0, 8)}`;
      const databaseResponse = database as unknown as {
        title?: Array<{ plain_text?: string }>;
      };

      if (
        databaseResponse.title &&
        Array.isArray(databaseResponse.title) &&
        databaseResponse.title.length > 0
      ) {
        const plainText = databaseResponse.title[0].plain_text;
        if (plainText) {
          databaseName = plainText;
        }
      }

      const typeName = generateTypeName(databaseName);

      sourceFile.addStatements(`    /**
     * Type-safe query method for the ${databaseName} database
     * @param databaseId The ID of the database to query
     * @returns A type-safe QueryBuilder for the ${typeName} record type
     */
    ${methodName}(databaseId: string): QueryBuilder<${typeName}, typeof ${typeName}FieldTypes>;`);
    } catch (error) {
      console.error(`Error adding method signature for ${databaseId}:`, error);
    }
  }

  sourceFile.addStatements(`  }
}
`);

  // Generate method implementations
  sourceFile.addStatements(`
// ============================================================================
// Method Implementations
// ============================================================================
`);

  for (let i = 0; i < databaseIds.length; i++) {
    const databaseId = databaseIds[i];
    const methodName = methodNames[i];

    try {
      const database = await notion.databases.retrieve({
        database_id: databaseId,
      });
      let databaseName = `Database${databaseId.substring(0, 8)}`;
      const databaseResponse = database as unknown as {
        title?: Array<{ plain_text?: string }>;
      };

      if (
        databaseResponse.title &&
        Array.isArray(databaseResponse.title) &&
        databaseResponse.title.length > 0
      ) {
        const plainText = databaseResponse.title[0].plain_text;
        if (plainText) {
          databaseName = plainText;
        }
      }

      const typeName = generateTypeName(databaseName);

      sourceFile.addStatements(`
// Implement ${methodName} method
NotionCMS.prototype.${methodName} = function(databaseId: string): QueryBuilder<${typeName}, typeof ${typeName}FieldTypes> {
  return this.query<${typeName}, typeof ${typeName}FieldTypes>(databaseId, ${typeName}FieldTypes);
};
`);
    } catch (error) {
      console.error(
        `Error adding method implementation for ${databaseId}:`,
        error
      );
    }
  }

  // Save the file
  await sourceFile.save();
  console.log(`Generated combined types file: ${combinedFilePath}`);
}

/**
 * Async version of getPropertyValue that supports file caching
 */
export async function getPropertyValueAsync(property: PropertyItemObjectResponse, fileManager?: any): Promise<any> {
  // For most properties, delegate to the sync version
  if (property.type !== "files") {
    return getPropertyValue(property, fileManager);
  }

  // Special handling for files when caching is enabled
  const filesProp = property as FilesPropertyItemObjectResponse;
  const files = filesProp.files.map((file) => ({
    name: file.name,
    url: file.type === "external" ? file.external.url : (file as any).file.url,
  }));

  // If fileManager is available and using cache strategy, process files
  if (fileManager && fileManager.config?.files?.strategy === "cache") {
    // Process files through the FileManager for caching
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          const processedUrl = await fileManager.processFileUrl(file.url, file.name);
          return {
            ...file,
            url: processedUrl,
          };
        } catch (error) {
          console.warn(`Failed to cache file ${file.name}:`, error);
          return file; // Fallback to original
        }
      })
    );
    return processedFiles;
  }

  return files;
}

/**
 * Async version of getAdvancedPropertyValue that supports file caching
 */
export async function getAdvancedPropertyValueAsync(
  property: PropertyItemObjectResponse,
  fileManager?: any
): Promise<any> {
  // For most properties, delegate to the sync version
  if (property.type !== "files") {
    return getAdvancedPropertyValue(property, fileManager);
  }

  // Special handling for files when caching is enabled
  const filesProp = property as FilesPropertyItemObjectResponse;
  const files = filesProp.files.map((file) => ({
    name: file.name,
    type: file.type,
    ...(file.type === "external" && {
      external: {
        url: file.external.url,
      },
    }),
    ...(file.type === "file" && {
      file: {
        url: file.file.url,
        expiry_time: file.file.expiry_time,
      },
    }),
  }));

  // If fileManager is available and using cache strategy, process files
  if (fileManager && fileManager.config?.files?.strategy === "cache") {
    // Process files through the FileManager for caching
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          const originalUrl = file.type === "external" ? file.external?.url : file.file?.url;
          if (originalUrl) {
            const processedUrl = await fileManager.processFileUrl(originalUrl, file.name);
            
            // Update the URL in the appropriate location
            if (file.type === "external" && file.external) {
              file.external.url = processedUrl;
            } else if (file.type === "file" && file.file) {
              file.file.url = processedUrl;
            }
          }
          return file;
        } catch (error) {
          console.warn(`Failed to cache file ${file.name}:`, error);
          return file; // Fallback to original
        }
      })
    );
    return processedFiles;
  }

  return files;
}

/**
 * Async version of processNotionRecord that supports file caching
 */
export async function processNotionRecordAsync(page: PageObjectResponse, fileManager?: any): Promise<DatabaseRecord> {
  // Simple values (base level access)
  const simple: Record<string, any> = {
    id: page.id,
  };

  // More detailed but still processed values
  const advanced: Record<string, any> = {
    id: page.id,
  };

  // Process each property
  for (const [key, value] of Object.entries(page.properties)) {
    // Simple version (direct access)
    simple[key] = await getPropertyValueAsync(value as PropertyItemObjectResponse, fileManager);

    // Advanced version (detailed access)
    advanced[key] = await getAdvancedPropertyValueAsync(
      value as PropertyItemObjectResponse,
      fileManager
    );
  }

  const result: DatabaseRecord = {
    ...simple,
    advanced: {
      id: page.id,
      ...advanced,
    },
    raw: {
      id: page.id,
      properties: page.properties,
    },
  };

  return result;
}

/**
 * Async version of processNotionRecords that supports file caching
 */
export async function processNotionRecordsAsync(
  pages: PageObjectResponse[],
  fileManager?: any
): Promise<DatabaseRecord[]> {
  return Promise.all(pages.map((page) => processNotionRecordAsync(page, fileManager)));
}
