import { NotionCMS } from "@mikemajara/notion-cms";
import { RecordNotionCMS } from "@/notion";
// // Import to ensure prototype extensions are executed
// import "@/notion/notion-types-notion-cms";

// Initialize the NotionCMS client
export const notion = new NotionCMS(process.env.NOTION_API_KEY!);

// Database ID from environment
export const NOTION_CMS_DATABASE_ID = process.env.NOTION_CMS_DATABASE_ID!;

// Helper function to get all documentation pages
export async function getAllDocPages(): Promise<RecordNotionCMS[]> {
  const result = await notion
    .queryNotionCMS(NOTION_CMS_DATABASE_ID)
    .sort("Order", "ascending")
    .paginate();

  return result.results;
}

// Helper function to get a specific page by ID
export async function getDocPage(id: string): Promise<RecordNotionCMS | null> {
  // Use the notion.getRecord method for getting by ID
  try {
    const record = await notion.getRecord<RecordNotionCMS>(id);
    return record;
  } catch (error) {
    return null;
  }
}

// Helper function to get a page by name/slug
export async function getDocPageBySlug(
  slug: string
): Promise<RecordNotionCMS | null> {
  const result = await notion
    .queryNotionCMS(NOTION_CMS_DATABASE_ID)
    .filter("Name", "equals", slug)
    .paginate(1);

  return result.results.length > 0 ? result.results[0] : null;
}

// Helper function to build hierarchical structure
export function buildDocumentationTree(
  pages: RecordNotionCMS[]
): RecordNotionCMS[] {
  // For now, just return sorted by order
  // Later we can implement hierarchical grouping using Parent item and Sub-item relations
  return pages.sort((a, b) => (a.Order || 0) - (b.Order || 0));
}
