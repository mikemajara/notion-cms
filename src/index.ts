import { Client } from "@notionhq/client";
import {
  DatabaseObjectResponse,
  PageObjectResponse,
  PropertyItemObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { getPropertyValue } from "./generator";

export class NotionCMS {
  private client: Client;

  constructor(token: string) {
    this.client = new Client({ auth: token });
  }

  async getDatabase<T>(databaseId: string): Promise<T[]> {
    const response = await this.client.databases.query({
      database_id: databaseId,
    });

    return response.results.map((page) =>
      this.mapPageToType<T>(page as PageObjectResponse)
    );
  }

  private mapPageToType<T>(page: PageObjectResponse): T {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(page.properties)) {
      result[key] = getPropertyValue(value as PropertyItemObjectResponse);
    }

    return result as T;
  }
}

// Re-export types and utilities
export * from "./generator";

// Export the main functionality
export { generateTypes, getPropertyValue } from "./generator";
export type { NotionPropertyType } from "./generator";
