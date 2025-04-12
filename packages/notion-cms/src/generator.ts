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
}

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
  token: string
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

  // First, ensure the base types file exists
  const baseTypesFile = path.join(outputPath, "notion-types.ts");
  if (!fs.existsSync(baseTypesFile)) {
    generateBaseTypesFile(outputPath);
  }

  // Initialize ts-morph project
  const project = new Project();
  const sourceFile = project.createSourceFile(
    path.join(outputPath, fileName),
    "",
    { overwrite: true }
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
  const project = new Project();
  const sourceFile = project.createSourceFile(
    path.join(outputPath, "notion-types.ts"),
    "",
    { overwrite: true }
  );

  // Add imports
  sourceFile.addImportDeclaration({
    moduleSpecifier: "@notionhq/client/build/src/api-endpoints",
    namedImports: ["PropertyItemObjectResponse", "PageObjectResponse"],
  });

  // Add base interface for all database records
  sourceFile.addInterface({
    name: "DatabaseRecord",
    properties: [{ name: "id", type: "string" }],
    isExported: true,
  });

  // Add base interface for all database properties
  sourceFile.addInterface({
    name: "DatabaseProperties",
    isExported: true,
  });

  // Add NotionPropertyType definition
  sourceFile.addTypeAlias({
    name: "NotionPropertyType",
    type: `"title" | "rich_text" | "number" | "select" | "multi_select" | "date" | "people" | "files" | "checkbox" | "url" | "email" | "phone_number" | "formula" | "relation" | "rollup" | "created_time" | "created_by" | "last_edited_time" | "last_edited_by"`,
    isExported: true,
  });

  // Add NotionProperty type
  sourceFile.addTypeAlias({
    name: "NotionProperty",
    typeParameters: [{ name: "T extends NotionPropertyType" }],
    type: "PropertyItemObjectResponse",
    isExported: true,
  });

  // Add the getPropertyValue helper function
  sourceFile.addFunction({
    name: "getPropertyValue",
    typeParameters: [{ name: "T extends NotionPropertyType" }],
    parameters: [
      {
        name: "property",
        type: "NotionProperty<T>",
      },
    ],
    returnType: "any",
    statements: [
      `switch (property.type) {
        case "title": {
          const titleProp = property as any;
          const richText = titleProp.title;
          return richText?.[0]?.plain_text ?? "";
        }
        case "rich_text": {
          const richTextProp = property as any;
          const richText = richTextProp.rich_text;
          return richText?.[0]?.plain_text ?? "";
        }
        case "number":
          return (property as any).number;
        case "select":
          return (property as any).select?.name ?? null;
        case "multi_select":
          return (property as any).multi_select.map((select: any) => select.name);
        case "date": {
          const dateProp = property as any;
          return dateProp.date ? new Date(dateProp.date.start) : null;
        }
        case "people": {
          const peopleProp = property as any;
          return Array.isArray(peopleProp.people)
            ? peopleProp.people.map((person: any) => ({
                id: person.id,
                name: person.name,
                avatar_url: person.avatar_url,
              }))
            : [];
        }
        case "files": {
          const filesProp = property as any;
          return filesProp.files.map((file: any) => ({
            name: file.name,
            url: file.type === "external" ? file.external.url : "",
          }));
        }
        case "checkbox":
          return (property as any).checkbox;
        case "url":
          return (property as any).url;
        case "email":
          return (property as any).email;
        case "phone_number":
          return (property as any).phone_number;
        case "formula":
          return (property as any).formula;
        case "relation": {
          const relationProp = property as any;
          return Array.isArray(relationProp.relation)
            ? relationProp.relation.map((rel: any) => rel.id)
            : [];
        }
        case "rollup":
          return (property as any).rollup;
        case "created_time":
          return (property as any).created_time;
        case "created_by": {
          const createdBy = (property as any).created_by;
          return {
            id: createdBy.id,
            name: createdBy.name,
            avatar_url: createdBy.avatar_url,
          };
        }
        case "last_edited_time":
          return (property as any).last_edited_time;
        case "last_edited_by": {
          const lastEditedBy = (property as any).last_edited_by;
          return {
            id: lastEditedBy.id,
            name: lastEditedBy.name,
            avatar_url: lastEditedBy.avatar_url,
          };
        }
        default:
          return null;
      }`,
    ],
    isExported: true,
  });

  // Add the simplifyNotionRecord helper function
  sourceFile.addFunction({
    name: "simplifyNotionRecord",
    typeParameters: [{ name: "T extends DatabaseRecord" }],
    parameters: [
      {
        name: "page",
        type: "PageObjectResponse",
      },
    ],
    returnType: "T",
    statements: [
      `const result: Record<string, any> = {
        id: page.id,
      };

      for (const [key, value] of Object.entries(page.properties)) {
        result[key] = getPropertyValue(value as PropertyItemObjectResponse);
      }

      return result as T;`,
    ],
    isExported: true,
  });

  // Add the simplifyNotionRecords helper function
  sourceFile.addFunction({
    name: "simplifyNotionRecords",
    typeParameters: [{ name: "T extends DatabaseRecord" }],
    parameters: [
      {
        name: "pages",
        type: "PageObjectResponse[]",
      },
    ],
    returnType: "T[]",
    statements: [`return pages.map(page => simplifyNotionRecord<T>(page));`],
    isExported: true,
  });

  // Add helper factory functions for creating type-specific simplifiers
  sourceFile.addFunction({
    name: "createSimplifyFunction",
    typeParameters: [{ name: "T extends DatabaseRecord" }],
    parameters: [
      {
        name: "typeName",
        type: "string",
      },
    ],
    returnType: "(page: PageObjectResponse) => T",
    statements: [
      `return (page: PageObjectResponse): T => {
        const result: Record<string, any> = {
          id: page.id,
        };
    
        for (const [key, value] of Object.entries(page.properties)) {
          result[key] = getPropertyValue(value as PropertyItemObjectResponse);
        }
    
        return result as T;
      };`,
    ],
    isExported: true,
  });

  sourceFile.addFunction({
    name: "createSimplifyRecordsFunction",
    typeParameters: [{ name: "T extends DatabaseRecord" }],
    parameters: [
      {
        name: "typeName",
        type: "string",
      },
    ],
    returnType: "(pages: PageObjectResponse[]) => T[]",
    statements: [
      `const simplifyFn = createSimplifyFunction<T>(typeName);
      return (pages: PageObjectResponse[]): T[] => {
        return pages.map((page) => simplifyFn(page));
      };`,
    ],
    isExported: true,
  });

  sourceFile.save();
}

// Generate database-specific types that import from the base types file
function generateDatabaseSpecificFile(
  sourceFile: SourceFile,
  properties: DatabaseObjectResponse["properties"],
  typeName: string,
  databaseName: string
): void {
  try {
    // Add imports from the base types file without re-exporting them
    sourceFile.addImportDeclaration({
      moduleSpecifier: "./notion-types",
      namedImports: [
        "DatabaseRecord",
        "DatabaseProperties",
        "NotionProperty",
        "NotionPropertyType",
        "getPropertyValue",
        "simplifyNotionRecord",
        "simplifyNotionRecords",
        "createSimplifyFunction",
        "createSimplifyRecordsFunction",
      ],
    });

    sourceFile.addImportDeclaration({
      moduleSpecifier: "@notionhq/client/build/src/api-endpoints",
      namedImports: ["PropertyItemObjectResponse", "PageObjectResponse"],
    });

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
      extends: ["DatabaseProperties"],
      properties: Object.entries(properties).map(([name, prop]) => ({
        name: sanitizePropertyName(name),
        type: `NotionProperty<'${(prop as NotionPropertyConfig).type}'>`,
      })),
      isExported: true,
    });

    // Extract the base name without "Record" suffix for simplify function naming
    const baseTypeName = typeName.replace(/Record$/, "");

    // Add typed version of simplify function for this specific database
    sourceFile.addFunction({
      name: `simplify${baseTypeName}Record`,
      parameters: [
        {
          name: "page",
          type: "PageObjectResponse",
        },
      ],
      returnType: typeName,
      statements: [`return simplifyNotionRecord<${typeName}>(page);`],
      isExported: true,
    });

    // Add typed version of simplifyRecords function for this specific database
    sourceFile.addFunction({
      name: `simplify${baseTypeName}Records`,
      parameters: [
        {
          name: "pages",
          type: "PageObjectResponse[]",
        },
      ],
      returnType: `${typeName}[]`,
      statements: [`return simplifyNotionRecords<${typeName}>(pages);`],
      isExported: true,
    });
  } catch (error) {
    console.error("Error generating database-specific types:", error);
    throw error;
  }
}

// Export these utility functions for use in other modules
export function simplifyNotionRecord(page: PageObjectResponse): DatabaseRecord {
  const result: Record<string, any> = {
    id: page.id,
  };

  for (const [key, value] of Object.entries(page.properties)) {
    result[key] = getPropertyValue(value as PropertyItemObjectResponse);
  }

  return result as DatabaseRecord;
}

export function simplifyNotionRecords(
  pages: PageObjectResponse[]
): DatabaseRecord[] {
  return pages.map((page) => simplifyNotionRecord(page));
}

// Add typed versions that can be used with specific database types
export function createSimplifyFunction<T extends DatabaseRecord>(
  typeName: string
): (page: PageObjectResponse) => T {
  return (page: PageObjectResponse): T => {
    const result: Record<string, any> = {
      id: page.id,
    };

    for (const [key, value] of Object.entries(page.properties)) {
      result[key] = getPropertyValue(value as PropertyItemObjectResponse);
    }

    return result as T;
  };
}

export function createSimplifyRecordsFunction<T extends DatabaseRecord>(
  typeName: string
): (pages: PageObjectResponse[]) => T[] {
  const simplifyFn = createSimplifyFunction<T>(typeName);
  return (pages: PageObjectResponse[]): T[] => {
    return pages.map((page) => simplifyFn(page));
  };
}

// Export the helper function directly
export function getPropertyValue<T extends NotionPropertyType>(
  property: PropertyItemObjectResponse
): any {
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
