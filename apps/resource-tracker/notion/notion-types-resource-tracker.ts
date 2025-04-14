import { DatabaseRecord, DatabaseProperties, NotionProperty, NotionPropertyType, getPropertyValue, simplifyNotionRecord, simplifyNotionRecords, createSimplifyFunction, createSimplifyRecordsFunction } from "./notion-types";
import { PropertyItemObjectResponse, PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export interface ResourceTrackerRecord extends DatabaseRecord {
    "Last Review Date": Date;
    "Estimated Monthly Cost": number;
    "Tag Compliance": boolean;
    Owner: { id: string; name: string | null; avatar_url: string | null; }[];
    "Last Used Date": Date;
    "Owner (User)": string;
    "Service Name": string[];
    "Linked Project / Jira Ticket": string;
    "Can Be Deprovisioned": boolean;
    Environment: string;
    "Auto Shutdown Configured": boolean;
    "Instance Size / Tier": string;
    "Estimated Monthly Cost (USD)": number;
    "Provision Date": Date;
    "Resource Type": string;
    Region: string;
    Team: string;
    Notes: string;
    "Is Active": boolean;
    "Reviewed by DevOps": any;
    "Reason for Keeping": string[];
    ID: any;
    Title: string;
}

export interface ResourceTrackerRecordProperties extends DatabaseProperties {
    "Last Review Date": NotionProperty<'date'>;
    "Estimated Monthly Cost": NotionProperty<'number'>;
    "Tag Compliance": NotionProperty<'checkbox'>;
    Owner: NotionProperty<'people'>;
    "Last Used Date": NotionProperty<'date'>;
    "Owner (User)": NotionProperty<'select'>;
    "Service Name": NotionProperty<'multi_select'>;
    "Linked Project / Jira Ticket": NotionProperty<'url'>;
    "Can Be Deprovisioned": NotionProperty<'checkbox'>;
    Environment: NotionProperty<'select'>;
    "Auto Shutdown Configured": NotionProperty<'checkbox'>;
    "Instance Size / Tier": NotionProperty<'rich_text'>;
    "Estimated Monthly Cost (USD)": NotionProperty<'number'>;
    "Provision Date": NotionProperty<'date'>;
    "Resource Type": NotionProperty<'select'>;
    Region: NotionProperty<'select'>;
    Team: NotionProperty<'rich_text'>;
    Notes: NotionProperty<'rich_text'>;
    "Is Active": NotionProperty<'checkbox'>;
    "Reviewed by DevOps": NotionProperty<'status'>;
    "Reason for Keeping": NotionProperty<'multi_select'>;
    ID: NotionProperty<'unique_id'>;
    Title: NotionProperty<'title'>;
}

export function simplifyResourceTrackerRecord(page: PageObjectResponse): ResourceTrackerRecord {
    return simplifyNotionRecord<ResourceTrackerRecord>(page);
}

export function simplifyResourceTrackerRecords(pages: PageObjectResponse[]): ResourceTrackerRecord[] {
    return simplifyNotionRecords<ResourceTrackerRecord>(pages);
}
