# Examples

Real-world usage patterns and examples based on the monorepo applications.

## Example: ERP Dashboard (Datasource App)

This example mirrors the `datasource` app pattern - displaying database records in a table.

### Setup

```typescript
// notion/index.ts (generated)
import { NotionCMS } from "./notion-types-erp-clients"
import { NotionCMS } from "./notion-types-erp-projects"

// These imports automatically register the databases
```

### Querying Multiple Databases

```typescript
import { NotionCMS } from "./notion"

export default async function Dashboard() {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

  // Query clients
  const clients = await notionCMS
    .query("eRPDataSourceClients", { recordType: "simple" })
    .all()

  // Query projects
  const projects = await notionCMS
    .query("eRPDataSourceProjects", { recordType: "simple" })
    .all()

  return (
    <table>
      <thead>
        <tr>
          <th>Client Name</th>
          <th>Contact Person</th>
          <th>Email</th>
          <th>Status</th>
          <th>Projects</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id}>
            <td>{client["Client Name"]}</td>
            <td>{client["Contact Person"]}</td>
            <td>{client.Email}</td>
            <td>{client.Status}</td>
            <td>
              {projects
                .filter((project) => project.Client.includes(client.id))
                .map((project) => project["Project Name"])
                .join(", ")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## Example: Blog with Content Rendering

Render blog posts with full content blocks.

### Fetching Posts

```typescript
import { NotionCMS } from "./notion"
import { blocksToMarkdown } from "@mikemajara/notion-cms"

export async function getBlogPosts() {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

  const posts = await notionCMS
    .query("blogPosts", { recordType: "simple" })
    .filter("Published", "equals", true)
    .sort("Publish Date", "descending")
    .all()

  return posts
}

export async function getBlogPost(slug: string) {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

  const post = await notionCMS
    .query("blogPosts", { recordType: "simple" })
    .filter("slug", "equals", slug)
    .single()

  // Fetch page content
  const blocks = await notionCMS.getPageContent(post.id)
  const markdown = blocksToMarkdown(blocks)

  return {
    ...post,
    content: markdown
  }
}
```

### Rendering with Next.js

```typescript
// app/blog/[slug]/page.tsx
import { getBlogPost } from "@/lib/blog"
import { Markdown } from "@/components/markdown"

export default async function BlogPost({
  params
}: {
  params: { slug: string }
}) {
  const post = await getBlogPost(params.slug)

  return (
    <article>
      <h1>{post.Title}</h1>
      <p>Published: {post["Publish Date"].toLocaleDateString()}</p>
      <Markdown>{post.content}</Markdown>
    </article>
  )
}
```

## Example: Filtered List with Pagination

Display paginated, filtered results.

```typescript
export async function getFilteredClients(
  status?: string,
  page: number = 1,
  pageSize: number = 10
) {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

  let query = notionCMS
    .query("eRPDataSourceClients", { recordType: "simple" })
    .sort("Last Contact", "descending")

  // Apply filter if provided
  if (status) {
    query = query.filter("Status", "equals", status)
  }

  // Paginate
  const result = await query
    .limit(pageSize)
    .startAfter(page > 1 ? getCursorForPage(page) : undefined)
    .execute()

  return {
    clients: result.results,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor
  }
}
```

## Example: File Caching for Static Site

Configure file caching for a Next.js static site.

```typescript
// lib/notion.ts
import { NotionCMS } from "./notion"

export const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
  files: {
    strategy: "local",
    storage: {
      path: "./public/assets/notion-files"
    }
  }
})

// app/posts/[slug]/page.tsx
import { notionCMS } from "@/lib/notion"
import { blocksToMarkdown } from "@mikemajara/notion-cms"

export default async function PostPage({
  params
}: {
  params: { slug: string }
}) {
  const post = await notionCMS
    .query("blogPosts", { recordType: "simple" })
    .filter("slug", "equals", params.slug)
    .single()

  // Images are automatically cached during build
  const blocks = await notionCMS.getPageContent(post.id)
  const markdown = blocksToMarkdown(blocks)

  return <Markdown>{markdown}</Markdown>
}
```

## Example: Advanced Layer for UI Components

Use Advanced layer when you need metadata like colors and avatars.

```typescript
export function ClientCard({ clientId }: { clientId: string }) {
  const [client, setClient] = useState(null)

  useEffect(() => {
    async function fetchClient() {
      const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

      const client = await notionCMS
        .query("eRPDataSourceClients", { recordType: "advanced" })
        .filter("id", "equals", clientId)
        .single()

      setClient(client)
    }
    fetchClient()
  }, [clientId])

  if (!client) return <div>Loading...</div>

  return (
    <div>
      <h2>{client["Client Name"]}</h2>

      {/* Display tags with colors */}
      <div>
        {client.Tags.map((tag) => (
          <span key={tag.id} style={{ backgroundColor: tag.color }}>
            {tag.name}
          </span>
        ))}
      </div>

      {/* Display status with color */}
      {client.Status && (
        <div style={{ color: client.Status.color }}>{client.Status.name}</div>
      )}

      {/* Display people with avatars */}
      {client.AssignedTo.map((person) => (
        <div key={person.id}>
          <img src={person.avatar_url} alt={person.name} />
          <span>{person.name}</span>
          {person.email && <span>{person.email}</span>}
        </div>
      ))}
    </div>
  )
}
```

## Example: Serverless API Route

API route that queries Notion and returns JSON.

```typescript
// app/api/clients/route.ts
import { NotionCMS } from "@/lib/notion"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const limit = parseInt(searchParams.get("limit") || "10")

  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

  let query = notionCMS
    .query("eRPDataSourceClients", { recordType: "simple" })
    .sort("Last Contact", "descending")
    .limit(limit)

  if (status) {
    query = query.filter("Status", "equals", status)
  }

  const clients = await query.all()

  return NextResponse.json({ clients })
}
```

## Example: Batch Processing

Process multiple records efficiently.

```typescript
export async function updateAllClients() {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

  // Fetch all clients
  const clients = await notionCMS
    .query("eRPDataSourceClients", { recordType: "simple" })
    .all()

  // Process in batches
  const batchSize = 10
  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (client) => {
        // Process each client
        await processClient(client)
      })
    )
  }
}
```

## Example: Error Handling

Handle query errors gracefully.

```typescript
export async function getClientByEmail(email: string) {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)

  try {
    const client = await notionCMS
      .query("eRPDataSourceClients", { recordType: "simple" })
      .filter("Email", "equals", email)
      .single()

    return { success: true, client }
  } catch (error) {
    if (error.message.includes("No records found")) {
      return { success: false, error: "Client not found" }
    }
    if (error.message.includes("Multiple records")) {
      return { success: false, error: "Multiple clients found" }
    }
    return { success: false, error: "Query failed" }
  }
}
```

## Example: Type-Safe Filtering

Leverage TypeScript's type safety for filters.

```typescript
// TypeScript ensures you use correct operators
const results = await notionCMS
  .query("myDatabase", { recordType: "simple" })
  .filter("Title", "contains", "search") // ✅ Valid
  .filter("Number", "greater_than", 100) // ✅ Valid
  .filter("Number", "contains", "text") // ❌ TypeScript error
  .all()
```

## Pattern: Placeholder for Custom Logic

Add your own patterns here:

```typescript
// TODO: Add example pattern
// Description: [What this pattern demonstrates]
// Use case: [When to use this pattern]

export async function yourPattern() {
  // Your implementation
}
```

## Next Steps

- Review **[Limitations](./08-limitations.md)** - Understand what's supported
- Check **[Core Concepts](./02-core-concepts.md)** - Deep dive into the API layers
- Explore the [monorepo apps](../../../apps/) - See full implementations
