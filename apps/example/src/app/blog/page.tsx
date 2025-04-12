import { NotionCMS } from "notion-cms";
import { BlogRecord } from "../../types/notion-types-blog";
import Link from "next/link";

export default async function BlogPage() {
  // Fetch blog posts from Notion
  let posts: BlogRecord[] = [];
  let error: string | null = null;

  try {
    const cms = new NotionCMS(process.env.NOTION_TOKEN!);
    const response = await cms.getDatabase<BlogRecord>(
      process.env.NOTION_BLOG_DATABASE_ID!,
      {
        filter: {
          property: "isPublished",
          checkbox: {
            equals: true,
          },
        },
        sorts: [
          {
            property: "publishedAt",
            direction: "descending",
          },
        ],
      }
    );
    posts = response.results;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch blog posts";
    console.error("Error fetching blog posts:", err);
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-2xl text-red-500">Error: {error}</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>
      <div className="w-full max-w-4xl space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link
              href={`/blog/${post.slug[post.slug.type]}`}
              key={post.id}
              className="block p-6 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
            >
              {/* <pre>{JSON.stringify(post.slug)}</pre> */}
              <h2 className="text-xl font-semibold">{post.name}</h2>
              {post.summary && (
                <p className="mt-2 text-gray-600">{post.summary}</p>
              )}
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>{post.author}</span>
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))
        ) : (
          <div className="p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold">No blog posts found</h2>
            <p className="mt-2 text-gray-600">
              Check back later for new content.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
