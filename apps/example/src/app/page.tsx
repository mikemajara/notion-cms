import { NotionCMS } from "notion-cms";
import { BlogRecord } from "../types/notion-types-blog";
import Link from "next/link";

// Server component for fetching data
export default async function Home() {
  // Fetch data on the server
  let records: BlogRecord[] = [];
  let error: string | null = null;

  try {
    const cms = new NotionCMS(process.env.NOTION_TOKEN!);
    const response = await cms.getDatabase<BlogRecord>(
      process.env.NOTION_BLOG_DATABASE_ID!
    );
    records = response.results;
    console.log("Fetched records:", JSON.stringify(records, null, 2));
    console.log("Type of records:", typeof records);
    console.log("Is array:", Array.isArray(records));
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch data";
    console.error("Error fetching data:", err);
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-2xl text-red-500">Error: {error}</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-4xl mb-8 flex justify-center">
        <Link
          href="/blog"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          View Blog
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-8">Notion Database Records</h1>
      <div className="w-full max-w-4xl space-y-4">
        {/* Log records before rendering */}
        {(() => {
          console.log("Rendering records:", JSON.stringify(records, null, 2));
          return null;
        })()}
        {records.length > 0 ? (
          records.map((record) => (
            <div
              key={record.id}
              className="p-6 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h2 className="text-2xl font-semibold">{record.name}</h2>
              {record.summary && (
                <p className="mt-2 text-gray-600">{record.summary}</p>
              )}
              {record.tags && record.tags.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {record.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-6 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors">
            <h2 className="text-2xl font-semibold">No records found</h2>
            <p className="mt-2 text-gray-600">
              The database appears to be empty.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
