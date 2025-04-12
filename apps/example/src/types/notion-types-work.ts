import { DatabaseRecord, DatabaseProperties, NotionProperty, NotionPropertyType, getPropertyValue, simplifyNotionRecord, simplifyNotionRecords, createSimplifyFunction, createSimplifyRecordsFunction } from "./notion-types";
import { PropertyItemObjectResponse, PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export interface WorkRecord extends DatabaseRecord {
    likes: number;
    tags: string[];
    publishedAt: Date;
    from: Date;
    isPublished: boolean;
    author: string;
    location: string;
    to: Date;
    locale: string;
    slug: string;
    isProtected: boolean;
    summary: string;
    "universal-slug": string;
    name: string;
}

export interface WorkRecordProperties extends DatabaseProperties {
    likes: NotionProperty<'number'>;
    tags: NotionProperty<'multi_select'>;
    publishedAt: NotionProperty<'date'>;
    from: NotionProperty<'date'>;
    isPublished: NotionProperty<'checkbox'>;
    author: NotionProperty<'rich_text'>;
    location: NotionProperty<'rich_text'>;
    to: NotionProperty<'date'>;
    locale: NotionProperty<'select'>;
    slug: NotionProperty<'rich_text'>;
    isProtected: NotionProperty<'checkbox'>;
    summary: NotionProperty<'rich_text'>;
    "universal-slug": NotionProperty<'rich_text'>;
    name: NotionProperty<'title'>;
}

export function simplifyWorkRecord(page: PageObjectResponse): WorkRecord {
    return simplifyNotionRecord<WorkRecord>(page);
}

export function simplifyWorkRecords(pages: PageObjectResponse[]): WorkRecord[] {
    return simplifyNotionRecords<WorkRecord>(pages);
}
