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
  id: string;
  [key: string]: any;
  // New properties for the layered API approach
  advanced?: {
    id: string;
    [key: string]: any;
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

const propertyTypeToTS = (propertyType: NotionPropertyType): string => {
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
      return "string";
    case "multi_select":
      return "string[]";
    case "date":
      return "Date";
    case "people":
      return "{ id: string; name: string | null; avatar_url: string | null; }[]";
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

  // Ensure first character is uppercase and add Record suffix
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + "Record";
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

  // First, ensure the base types file exists - will be created only if it doesn't exist yet
  // (overwriting is handled in the CLI)
  const baseTypesFile = path.join(outputPath, "notion-types.ts");
  if (!fs.existsSync(baseTypesFile)) {
    generateBaseTypesFile(outputPath);
  }

  // Generate the database-specific file
  const specificFilePath = path.join(outputPath, fileName);

  // Initialize ts-morph project
  const project = new Project();
  const sourceFile = project.createSourceFile(
    specificFilePath,
    "",
    { overwrite: true } // Database-specific files are always overwritten
  );

  // Generate database-specific types file that imports from the base file
  generateDatabaseSpecificFile(sourceFile, properties, typeName, databaseName);

  // Save the file
  await sourceFile.save();

  // Also generate an index file that exports everything from all generated files
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

// Export common types from base file
export * from './notion-types';

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

// Generate the base types file with common types and utilities
function generateBaseTypesFile(outputPath: string): void {
  try {
    // Initialize ts-morph project for the base file
    const project = new Project();
    const sourceFile = project.createSourceFile(
      path.join(outputPath, "notion-types.ts"),
      "",
      { overwrite: true }
    );

    // Add warning about auto-generation
    sourceFile.addStatements(`/**
 * THIS FILE IS AUTO-GENERATED BY NOTION-CMS
 * DO NOT EDIT DIRECTLY - YOUR CHANGES WILL BE OVERWRITTEN
 */`);

    // Add imports
    sourceFile.addImportDeclaration({
      moduleSpecifier: "@notionhq/client/build/src/api-endpoints",
      namedImports: ["PropertyItemObjectResponse", "PageObjectResponse"],
    });

    // Add imports from the library
    sourceFile.addImportDeclaration({
      moduleSpecifier: "notion-cms",
      namedImports: [
        "DatabaseRecord",
        "NotionPropertyType",
        "getPropertyValue",
        "simplifyNotionRecord",
        "simplifyNotionRecords",
        "createSimplifyFunction",
        "createSimplifyRecordsFunction",
      ],
    });

    // Re-export the types and functions
    sourceFile.addStatements(`
// Re-export types and functions from the library
export type { DatabaseRecord, NotionPropertyType };
export { 
  getPropertyValue,
  simplifyNotionRecord,
  simplifyNotionRecords,
  createSimplifyFunction,
  createSimplifyRecordsFunction
};`);

    // Add the DatabaseProperties interface
    sourceFile.addInterface({
      name: "DatabaseProperties",
      properties: [],
      isExported: true,
    });

    // Save the file
    sourceFile.save();
  } catch (error) {
    console.error("Error generating base types file:", error);
    throw error;
  }
}

// Generate database-specific types that import from the base types file
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

    // Add imports from the base types file
    sourceFile.addImportDeclaration({
      moduleSpecifier: "./notion-types",
      namedImports: ["DatabaseRecord", "NotionPropertyType"],
    });

    sourceFile.addImportDeclaration({
      moduleSpecifier: "@notionhq/client/build/src/api-endpoints",
      namedImports: ["PropertyItemObjectResponse"],
    });

    // Add type definition for NotionProperty specific to this file
    sourceFile.addStatements(`
// Use PropertyItemObjectResponse for property type definitions
type NotionProperty<T extends NotionPropertyType> = PropertyItemObjectResponse;`);

    // Generate the database-specific type
    sourceFile.addInterface({
      name: typeName,
      extends: ["DatabaseRecord"],
      properties: Object.entries(properties).map(([name, prop]) => ({
        name: sanitizePropertyName(name),
        type: propertyTypeToTS((prop as NotionPropertyConfig).type),
      })),
      isExported: true,
    });

    // Generate the database-specific properties type
    sourceFile.addInterface({
      name: `${typeName}Properties`,
      extends: [],
      properties: Object.entries(properties).map(([name, prop]) => ({
        name: sanitizePropertyName(name),
        type: `NotionProperty<'${(prop as NotionPropertyConfig).type}'>`,
      })),
      isExported: true,
    });

    // We're removing the simplified helper functions to keep the generated file minimal
  } catch (error) {
    console.error("Error generating database-specific types:", error);
    throw error;
  }
}

/**
 * Process a Notion page into a record with layered access (simple, advanced, raw)
 * @param page The Notion page object from the API
 * @returns A processed record with simple, advanced, and raw access
 */
export function processNotionRecord(page: PageObjectResponse): DatabaseRecord {
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
    simple[key] = getPropertyValue(value as PropertyItemObjectResponse);

    // Advanced version (detailed access)
    advanced[key] = getAdvancedPropertyValue(
      value as PropertyItemObjectResponse
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
  pages: PageObjectResponse[]
): DatabaseRecord[] {
  return pages.map((page) => processNotionRecord(page));
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
export function getPropertyValue(property: PropertyItemObjectResponse): any {
  switch (property.type) {
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
        ? peopleProp.people.map((person: UserObjectResponse) => ({
            id: person.id,
            name: person.name,
            avatar_url: person.avatar_url,
          }))
        : [];
    }
    case "files": {
      const filesProp = property as FilesPropertyItemObjectResponse;
      return filesProp.files.map((file) => ({
        name: file.name,
        url: file.type === "external" ? file.external.url : "",
      }));
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
  property: PropertyItemObjectResponse
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
      return filesProp.files.map((file) => ({
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
    default:
      return null;
  }
}
