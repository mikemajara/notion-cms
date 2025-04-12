import { NotionCMS } from "notion-cms";
import { BlogRecord } from "../../../types/notion-types-blog";
import Link from "next/link";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = params;

  // Fetch the specific blog post by slug
  let post: BlogRecord | null = null;
  let content: string = "";
  let error: string | null = null;

  try {
    const cms = new NotionCMS(process.env.NOTION_TOKEN!);

    // First, get all posts and find the one with the matching slug
    const response = await cms.getDatabase<BlogRecord>(
      process.env.NOTION_BLOG_DATABASE_ID!,
      {
        filter: {
          property: "slug",
          formula: {
            string: {
              equals: slug,
            },
          },
        },
      }
    );

    if (response.results.length > 0) {
      post = response.results[0];

      // Fetch the content of the post
      const blocks = await cms.getPageContent(post.id, true);
      content = cms.blocksToMarkdown(blocks, { includeImageUrls: true });
    } else {
      error = "Blog post not found";
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch blog post";
    console.error("Error fetching blog post:", err);
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-2xl text-red-500">Error: {error}</div>
        <Link href="/blog" className="mt-4 text-blue-500 hover:underline">
          Back to Blog
        </Link>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-2xl">Blog post not found</div>
        <Link href="/blog" className="mt-4 text-blue-500 hover:underline">
          Back to Blog
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-3xl">
        <Link
          href="/blog"
          className="text-blue-500 hover:underline mb-6 inline-block"
        >
          ← Back to Blog
        </Link>

        <article className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold mb-4">{post.name}</h1>

          <div className="flex justify-between text-sm text-gray-500 mb-6">
            <span>By {post.author}</span>
            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
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

          {/* Replace newlines with BR tags for simple markdown rendering */}
          <div
            dangerouslySetInnerHTML={{
              __html: content
                .split("\n")
                .map((line) => (line ? `<p>${line}</p>` : "<br/>"))
                .join(""),
            }}
          />
        </article>
      </div>
    </main>
  );
}
