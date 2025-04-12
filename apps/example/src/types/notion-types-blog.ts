import { DatabaseRecord, DatabaseProperties, NotionProperty, NotionPropertyType, getPropertyValue, simplifyNotionRecord, simplifyNotionRecords, createSimplifyFunction, createSimplifyRecordsFunction } from "./notion-types";
import { PropertyItemObjectResponse, PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export interface BlogRecord extends DatabaseRecord {
    likes: number;
    Keywords: string[];
    tags: string[];
    createdAt: string;
    slug: any;
    series: string;
    publishedAt: Date;
    isPublished: boolean;
    "meta-title": string;
    author: string;
    editedAt: string;
    "Automatic fields": any;
    archive: boolean;
    locale: string;
    "meta-summary": string;
    isProtected: boolean;
    Related: string[];
    summary: string;
    name: string;
}

export interface BlogRecordProperties extends DatabaseProperties {
    likes: NotionProperty<'number'>;
    Keywords: NotionProperty<'multi_select'>;
    tags: NotionProperty<'multi_select'>;
    createdAt: NotionProperty<'created_time'>;
    slug: NotionProperty<'formula'>;
    series: NotionProperty<'select'>;
    publishedAt: NotionProperty<'date'>;
    isPublished: NotionProperty<'checkbox'>;
    "meta-title": NotionProperty<'rich_text'>;
    author: NotionProperty<'rich_text'>;
    editedAt: NotionProperty<'last_edited_time'>;
    "Automatic fields": NotionProperty<'formula'>;
    archive: NotionProperty<'checkbox'>;
    locale: NotionProperty<'select'>;
    "meta-summary": NotionProperty<'rich_text'>;
    isProtected: NotionProperty<'checkbox'>;
    Related: NotionProperty<'relation'>;
    summary: NotionProperty<'rich_text'>;
    name: NotionProperty<'title'>;
}

export function simplifyBlogRecord(page: PageObjectResponse): BlogRecord {
    return simplifyNotionRecord<BlogRecord>(page);
}

export function simplifyBlogRecords(pages: PageObjectResponse[]): BlogRecord[] {
    return simplifyNotionRecords<BlogRecord>(pages);
}
