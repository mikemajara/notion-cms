import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface BlogPost {
  slug: string
  title: string
  description?: string
  date?: string
  content: string
  frontmatter: Record<string, any>
  category?: string
}

const DOCS_PATH = path.join(process.cwd(), "../../packages/notion-cms/docs")

// Recursively get all markdown files from a directory
function getMarkdownFiles(dir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Recursively get files from subdirectories
      const subFiles = getMarkdownFiles(fullPath)
      files.push(...subFiles)
    } else if (item.endsWith(".md") && item !== "README.md") {
      files.push(fullPath)
    }
  }

  return files
}

export function getBlogPosts(): BlogPost[] {
  if (!fs.existsSync(DOCS_PATH)) {
    console.warn(`Docs path does not exist: ${DOCS_PATH}`)
    return []
  }

  const markdownFiles = getMarkdownFiles(DOCS_PATH)
  const posts: BlogPost[] = []

  for (const filePath of markdownFiles) {
    const fileContent = fs.readFileSync(filePath, "utf8")
    const { data: frontmatter, content } = matter(fileContent)

    // Get relative path from docs directory
    const relativePath = path.relative(DOCS_PATH, filePath)
    const slug = relativePath.replace(".md", "").replace(/\\/g, "/")

    // Extract category from path (e.g., "api-guide/simplified-api" -> "api-guide")
    const category = relativePath.includes(path.sep)
      ? relativePath.split(path.sep)[0]
      : undefined

    posts.push({
      slug,
      title:
        frontmatter.title ||
        slug
          .split("/")
          .pop()
          ?.replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()) ||
        slug,
      description: frontmatter.description || "",
      date: frontmatter.date || "",
      content,
      frontmatter,
      category,
    })
  }

  // Sort by date if available, otherwise by title
  return posts.sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    return a.title.localeCompare(b.title)
  })
}

export function getBlogPost(slug: string): BlogPost | null {
  // Handle both flat and nested slugs
  const possiblePaths = [
    path.join(DOCS_PATH, `${slug}.md`),
    path.join(DOCS_PATH, slug.replace("/", path.sep) + ".md"),
  ]

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8")
      const { data: frontmatter, content } = matter(fileContent)

      // Extract category from path
      const relativePath = path.relative(DOCS_PATH, filePath)
      const category = relativePath.includes(path.sep)
        ? relativePath.split(path.sep)[0]
        : undefined

      return {
        slug,
        title:
          frontmatter.title ||
          slug
            .split("/")
            .pop()
            ?.replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()) ||
          slug,
        description: frontmatter.description || "",
        date: frontmatter.date || "",
        content,
        frontmatter,
        category,
      }
    }
  }

  return null
}

export function getBlogSlugs(): string[] {
  if (!fs.existsSync(DOCS_PATH)) {
    return []
  }

  const markdownFiles = getMarkdownFiles(DOCS_PATH)
  return markdownFiles.map((filePath) => {
    const relativePath = path.relative(DOCS_PATH, filePath)
    return relativePath.replace(".md", "").replace(/\\/g, "/")
  })
}

// Get posts grouped by category
export function getBlogPostsByCategory(): Record<string, BlogPost[]> {
  const posts = getBlogPosts()
  const grouped: Record<string, BlogPost[]> = {}

  for (const post of posts) {
    const category = post.category || "general"
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(post)
  }

  return grouped
}
