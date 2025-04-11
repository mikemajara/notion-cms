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
} from "@notionhq/client/build/src/api-endpoints";
import * as fs from "fs";
import * as path from "path";
import { Project, SourceFile } from "ts-morph";

// Define and export the NotionPropertyType
export type NotionPropertyType =
  DatabaseObjectResponse["properties"][string]["type"];
type NotionPropertyConfig = DatabaseObjectResponse["properties"][string];

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

  // Create output directory if it doesn't exist
  fs.mkdirSync(outputPath, { recursive: true });

  // Initialize ts-morph project
  const project = new Project();
  const sourceFile = project.createSourceFile(
    path.join(outputPath, "notion-types.ts"),
    "",
    { overwrite: true }
  );

  // Generate types
  generateDatabaseTypes(sourceFile, properties);
  generateHelperTypes(sourceFile);
  generateHelperFunctions(sourceFile);

  // Save the file
  await sourceFile.save();
}

function generateDatabaseTypes(
  sourceFile: SourceFile,
  properties: DatabaseObjectResponse["properties"]
): void {
  try {
    // Generate the main database type
    sourceFile.addInterface({
      name: "DatabaseRecord",
      properties: Object.entries(properties).map(([name, prop]) => ({
        name: sanitizePropertyName(name),
        type: propertyTypeToTS((prop as NotionPropertyConfig).type),
      })),
      isExported: true,
    });

    // Generate the raw property types
    sourceFile.addInterface({
      name: "DatabaseProperties",
      properties: Object.entries(properties).map(([name, prop]) => ({
        name: sanitizePropertyName(name),
        type: `NotionProperty<'${(prop as NotionPropertyConfig).type}'>`,
      })),
      isExported: true,
    });
  } catch (error) {
    console.error("Error generating database types:", error);
    throw error;
  }
}

function generateHelperTypes(sourceFile: SourceFile): void {
  // Add imports
  sourceFile.addImportDeclaration({
    moduleSpecifier: "@notionhq/client/build/src/api-endpoints",
    namedImports: ["PropertyItemObjectResponse"],
  });

  // Add NotionPropertyType definition if not imported
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

function generateHelperFunctions(sourceFile: SourceFile): void {
  // Instead of adding the function with its toString(), add a proper statement
  sourceFile.addFunction({
    name: "getPropertyValue",
    typeParameters: [{ name: "T extends NotionPropertyType" }],
    parameters: [{ name: "property", type: "NotionProperty<T>" }],
    returnType: "any",
    isExported: true,
    statements: `  switch (property.type) {
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
  }
`,
  });
}
