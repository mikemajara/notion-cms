/**
 * THIS FILE IS AUTO-GENERATED BY NOTION-CMS
 * DO NOT EDIT DIRECTLY - YOUR CHANGES WILL BE OVERWRITTEN
 *
 * Generated for database: Notion CMS
 */
import {
  DatabaseRecord,
  NotionCMS,
  QueryBuilder,
  DatabaseFieldMetadata,
} from "@mikemajara/notion-cms";
export const RecordNotionCMSFieldTypes = {
  id: { type: "unique_id" },
  _slug: { type: "formula" },
  Tags: {
    type: "multi_select",
    options: ["Onboarding", "Design"] as const,
  },
  "Sub-page": { type: "relation" },
  "Last edited time": { type: "last_edited_time" },
  "Parent page": { type: "relation" },
  Name: { type: "title" },
  Verification: { type: "verification" },
  Owner: { type: "people" },
  slug: { type: "rich_text" },
  Order: { type: "number" },
} as const satisfies DatabaseFieldMetadata;

export interface RecordNotionCMSAdvanced {
  id: string;
  _slug: { type: string; value: any };
  Tags: { id: string; name: string; color: string }[];
  "Sub-page": { id: string }[];
  "Last edited time": { timestamp: string; date: Date };
  "Parent page": { id: string }[];
  Name: {
    content: string;
    annotations: any;
    href: string | null;
    link?: { url: string } | null;
  }[];
  Verification: any;
  Owner: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    object: string;
    type: string;
    email?: string;
  }[];
  slug: {
    content: string;
    annotations: any;
    href: string | null;
    link?: { url: string } | null;
  }[];
  Order: number;
}

export interface RecordNotionCMSRaw {
  id: string;
  properties: Record<string, any>;
}

export interface RecordNotionCMS extends DatabaseRecord {
  id: string;
  _slug: any;
  Tags: Array<"Onboarding" | "Design">;
  "Sub-page": string[];
  "Last edited time": string;
  "Parent page": string[];
  Name: string;
  Verification: any;
  Owner: string[];
  slug: string;
  Order: number;
  advanced: RecordNotionCMSAdvanced;
  raw: RecordNotionCMSRaw;
}

// Extend NotionCMS class with database-specific method
/* eslint-disable */
declare module "@mikemajara/notion-cms" {
  interface NotionCMS {
    /**
     * Type-safe query method for the Notion CMS database
     * @param databaseId The ID of the database to query
     * @returns A type-safe QueryBuilder for the RecordNotionCMS record type
     */
    queryNotionCMS(
      databaseId: string
    ): QueryBuilder<RecordNotionCMS, typeof RecordNotionCMSFieldTypes>;
  }
}

// Implement the method on the NotionCMS prototype
NotionCMS.prototype.queryNotionCMS = function (
  databaseId: string
): QueryBuilder<RecordNotionCMS, typeof RecordNotionCMSFieldTypes> {
  return this.query<RecordNotionCMS, typeof RecordNotionCMSFieldTypes>(
    databaseId,
    RecordNotionCMSFieldTypes
  );
};
