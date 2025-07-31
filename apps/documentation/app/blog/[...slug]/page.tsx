import { getBlogPost, getBlogSlugs } from "@/lib/blog"
import { MDXRemote } from "next-mdx-remote/rsc"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { components } from "@/mdx-components"

interface BlogPostPageProps {
  params: Promise<{ slug: string[] }>
}

export async function generateStaticParams() {
  const slugs = getBlogSlugs()
  return slugs.map((slug) => ({
    slug: slug.split("/"), // Convert to array for catch-all route
  }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const fullSlug = slug.join("/") // Reconstruct full path
  const post = getBlogPost(fullSlug)

  if (!post) {
    notFound()
  }

  return (
    <div className="max-w-[90%]">
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-primary/60 hover:text-primary transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Blog
        </Link>
      </div>

      <article className="prose prose-primary max-w-none">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">{post.title}</h1>
          {post.date && (
            <time className="text-sm text-primary/60">
              {new Date(post.date).toLocaleDateString()}
            </time>
          )}
          {post.description && (
            <p className="text-lg text-primary/80 mt-4">{post.description}</p>
          )}
        </header>

        <div className="prose prose-primary max-w-none">
          <MDXRemote source={post.content} components={components} />
        </div>
      </article>
    </div>
  )
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params
  const fullSlug = slug.join("/") // Reconstruct full path
  const post = getBlogPost(fullSlug)

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  return {
    title: `${post.title} - Notion CMS Blog`,
    description: post.description || `Read about ${post.title}`,
  }
}
