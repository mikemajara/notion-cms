import { getAllDocPages, buildDocumentationTree } from "@/lib/notion";
import { RecordNotionCMS } from "@/notion";
import Link from "next/link";

export const metadata = {
  title: "Notion CMS Documentation",
  description: "Comprehensive documentation for Notion CMS library",
};

// Create page component for individual documentation items
function DocumentationItem({ page }: { page: RecordNotionCMS }) {
  const slug = page.slug;

  return (
    <div className="block group">
      <Link
        href={`/docs/${slug}`}
        className="flex items-center justify-between p-4 transition-all duration-200"
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center flex-shrink-0 w-8 h-8">
            <span className="text-sm font-semibold text-primary">
              {page.Order || "•"}
            </span>
          </div>
          <div>
            <h3 className="font-light text-primary transition-colors group-hover:text-primary group-hover:font-medium">
              {page.Name}
            </h3>
          </div>
        </div>
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-primary transition-colors group-hover:text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const pages = await getAllDocPages();
  const sortedPages = buildDocumentationTree(pages);

  return (
    <div className="max-w-[90%]">
      <header className="mb-12">
        <h1 className="mb-4 text-4xl font-bold text-primary">
          Notion CMS Documentation
        </h1>
        <p className="text-lg leading-7 text-primary">
          Welcome to the comprehensive documentation for Notion CMS. This
          library simplifies the Notion API to facilitate developer experience
          with Notion as a content management system.
        </p>
      </header>

      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-primary">
              Documentation Pages
            </h2>
            <span className="text-sm text-primary">
              {sortedPages.length} page{sortedPages.length !== 1 ? "s" : ""}
            </span>
          </div>

          {sortedPages.length > 0 ? (
            <div className="grid -gap-1">
              {sortedPages.map((page) => (
                <DocumentationItem key={page.id} page={page} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center rounded-lg bg-secondary">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-secondary rounded-lg">
                <svg
                  className="w-6 h-6 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p className="mb-2 text-lg text-primary">
                No documentation pages found
              </p>
              <p className="text-sm text-primary">
                Add some pages to your Notion database to get started.
              </p>
            </div>
          )}
        </section>

        <section className="p-6 rounded-lg bg-secondary-50">
          <h3 className="mb-2 text-lg font-semibold text-secondary-900">
            Getting Started
          </h3>
          <p className="mb-4 text-secondary-700">
            This documentation is powered by Notion CMS. All content is managed
            through a Notion database and automatically synchronized with this
            documentation site.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center text-sm text-secondary-600">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Real-time updates
            </div>
            <div className="flex items-center text-sm text-secondary-600">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Type-safe queries
            </div>
            <div className="flex items-center text-sm text-secondary-600">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Hierarchical structure
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
