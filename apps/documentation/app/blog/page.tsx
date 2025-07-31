import { getBlogPostsByCategory } from "@/lib/blog"
import Link from "next/link"

export const metadata = {
  title: "Blog - Notion CMS Documentation",
  description: "Blog posts and articles about Notion CMS",
}

export default async function BlogPage() {
  const postsByCategory = getBlogPostsByCategory()

  return (
    <div className="max-w-[90%]">
      <header className="mb-12">
        <h1 className="mb-4 text-4xl font-bold text-primary">Blog</h1>
        <p className="text-lg leading-7 text-primary">
          Articles, guides, and insights about Notion CMS development.
        </p>
      </header>

      <div className="space-y-12">
        {Object.keys(postsByCategory).length > 0 ? (
          Object.entries(postsByCategory).map(([category, posts]) => (
            <section key={category}>
              <h2 className="text-2xl font-semibold text-primary mb-6 capitalize">
                {category.replace(/-/g, " ")}
              </h2>
              <div className="grid gap-6">
                {posts.map((post) => (
                  <article
                    key={post.slug}
                    className="p-6 border rounded-lg hover:border-primary transition-colors"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                            {post.title}
                          </h3>
                          {post.date && (
                            <time className="text-sm text-primary/60">
                              {new Date(post.date).toLocaleDateString()}
                            </time>
                          )}
                        </div>
                        {post.description && (
                          <p className="text-primary/80 leading-relaxed">
                            {post.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-primary/60">
                            <span>Read more →</span>
                          </div>
                          {post.category && post.category !== "general" && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {post.category.replace(/-/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))
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
            <p className="mb-2 text-lg text-primary">No blog posts found</p>
            <p className="text-sm text-primary">
              Add some markdown files to the docs folder to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
