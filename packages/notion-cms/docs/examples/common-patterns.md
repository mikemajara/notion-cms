---
title: "Common Patterns"
description: "Real-world examples and common patterns for using Notion CMS in your projects."
date: "2024-01-21"
---

# Common Patterns

Real-world examples of using Notion CMS for typical content management scenarios.

## Blog Website

### Basic Blog Setup

```typescript
import { NotionCMS } from "@mikemajara/notion-cms"

const cms = new NotionCMS(process.env.NOTION_API_KEY!)

// Get published blog posts
async function getBlogPosts() {
  return await cms
    .query(process.env.BLOG_DATABASE_ID!)
    .filter("Status", "equals", "Published")
    .filter("PublishDate", "on_or_before", new Date())
    .sort("PublishDate", "descending")
    .all()
}

// Get single blog post with content
async function getBlogPost(postId: string) {
  const post = await cms.getRecord(postId)
  const content = await cms.getPageContent(postId)

  return {
    ...post,
    content: cms.blocksToMarkdown(content),
  }
}
```

### Blog with Categories and Tags

```typescript
// Get posts by category
async function getPostsByCategory(category: string) {
  return await cms
    .query(process.env.BLOG_DATABASE_ID!)
    .filter("Status", "equals", "Published")
    .filter("Category", "equals", category)
    .sort("PublishDate", "descending")
    .all()
}

// Get posts by tag
async function getPostsByTag(tag: string) {
  return await cms
    .query(process.env.BLOG_DATABASE_ID!)
    .filter("Status", "equals", "Published")
    .filter("Tags", "contains", tag)
    .sort("PublishDate", "descending")
    .all()
}

// Get all categories and tags for navigation
async function getBlogMetadata() {
  const posts = await cms
    .query(process.env.BLOG_DATABASE_ID!)
    .filter("Status", "equals", "Published")
    .all()

  const categories = [
    ...new Set(posts.map((p) => p.Category).filter(Boolean)),
  ]
  const tags = [...new Set(posts.flatMap((p) => p.Tags || []))]

  return { categories: categories.sort(), tags: tags.sort() }
}
```

## E-commerce Product Catalog

### Product Listing

```typescript
// Get active products
async function getProducts() {
  return await cms
    .query(process.env.PRODUCTS_DATABASE_ID!)
    .filter("Active", "equals", true)
    .filter("Price", "greater_than", 0)
    .sort("Name", "ascending")
    .all()
}

// Get products by category with filtering
async function getProductsByCategory(category: string, filters = {}) {
  let query = cms
    .query(process.env.PRODUCTS_DATABASE_ID!)
    .filter("Active", "equals", true)
    .filter("Category", "equals", category)

  // Add price range filter
  if (filters.minPrice) {
    query = query.filter("Price", "greater_than_or_equal_to", filters.minPrice)
  }
  if (filters.maxPrice) {
    query = query.filter("Price", "less_than_or_equal_to", filters.maxPrice)
  }

  // Add availability filter
  if (filters.inStock) {
    query = query.filter("InStock", "equals", true)
  }

  return await query.sort("Name", "ascending").all()
}

// Search products
async function searchProducts(searchTerm: string) {
  // Note: Complex OR logic requires using raw Notion API filters
  // This is a simplified version - for full OR support, use getDatabase with filter options
  return await cms
    .query(process.env.PRODUCTS_DATABASE_ID!)
    .filter("Active", "equals", true)
    .filter("Name", "contains", searchTerm)
    .sort("Name", "ascending")
    .all()
}
```

### Product Details with Images

```typescript
async function getProductDetails(productId: string) {
  const product = await cms.getRecord(productId)

  // Get product images from advanced API
  const images =
    product.advanced.Images?.map((img) => ({
      url: img.url,
      name: img.name,
      alt: `${product.Name} - ${img.name}`,
    })) || []

  // Get product description as HTML
  const descriptionBlocks = await cms.getPageContent(productId)
  const description = cms.blocksToHtml(descriptionBlocks)

  return {
    ...product,
    images,
    description,
  }
}
```

## Event Management

### Event Listings

```typescript
// Get upcoming events
async function getUpcomingEvents() {
  return await cms
    .query(process.env.EVENTS_DATABASE_ID!)
    .filter("Date", "on_or_after", new Date())
    .filter("Status", "equals", "Published")
    .sort("Date", "ascending")
    .all()
}

// Get events by month
async function getEventsByMonth(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  return await cms
    .query(process.env.EVENTS_DATABASE_ID!)
    .filter("Date", "on_or_after", startDate)
    .filter("Date", "on_or_before", endDate)
    .filter("Status", "equals", "Published")
    .sort("Date", "ascending")
    .all()
}

// Event registration status
async function getEventWithAvailability(eventId: string) {
  const event = await cms.getRecord(eventId)

  const spotsLeft = event.MaxAttendees - (event.CurrentAttendees || 0)
  const isAvailable = spotsLeft > 0 && new Date(event.Date) > new Date()

  return {
    ...event,
    spotsLeft,
    isAvailable,
    isFull: spotsLeft <= 0,
  }
}
```

## Team Directory

### Staff Listings

```typescript
// Get all active team members
async function getTeamMembers() {
  return await cms
    .query(process.env.TEAM_DATABASE_ID!)
    .filter("Active", "equals", true)
    .sort("Name", "ascending")
    .all()
}

// Get team members by department
async function getTeamByDepartment(department: string) {
  return await cms
    .query(process.env.TEAM_DATABASE_ID!)
    .filter("Active", "equals", true)
    .filter("Department", "equals", department)
    .sort("Name", "ascending")
    .all()
}

// Get team member details with bio
async function getTeamMemberDetails(memberId: string) {
  const member = await cms.getRecord(memberId)

  // Get bio content
  const bioBlocks = await cms.getPageContent(memberId)
  const bio = cms.blocksToMarkdown(bioBlocks)

  // Get profile image from advanced API
  const profileImage = member.advanced.Photo?.[0]?.url

  return {
    ...member,
    bio,
    profileImage,
  }
}
```

## FAQ / Knowledge Base

### FAQ Categories

```typescript
// Get FAQ items by category
async function getFAQByCategory(category: string) {
  return await cms
    .query(process.env.FAQ_DATABASE_ID!)
    .filter("Published", "equals", true)
    .filter("Category", "equals", category)
    .sort("Order", "ascending")
    .all()
}

// Search FAQ
async function searchFAQ(searchTerm: string) {
  // Note: For complex OR logic, use getDatabase with raw filters
  return await cms
    .query(process.env.FAQ_DATABASE_ID!)
    .filter("Published", "equals", true)
    .filter("Question", "contains", searchTerm)
    .sort("Question", "ascending")
    .all()
}

// Get FAQ with formatted answer
async function getFAQDetails(faqId: string) {
  const faq = await cms.getRecord(faqId)

  // Get detailed answer as HTML
  const answerBlocks = await cms.getPageContent(faqId)
  const answer = cms.blocksToHtml(answerBlocks)

  return {
    ...faq,
    answer,
  }
}
```

## Portfolio/Gallery

### Project Showcase

```typescript
// Get featured projects
async function getFeaturedProjects() {
  return await cms
    .query(process.env.PORTFOLIO_DATABASE_ID!)
    .filter("Featured", "equals", true)
    .filter("Status", "equals", "Published")
    .sort("Order", "ascending")
    .all()
}

// Get projects by type/category
async function getProjectsByType(type: string) {
  return await cms
    .query(process.env.PORTFOLIO_DATABASE_ID!)
    .filter("Status", "equals", "Published")
    .filter("Type", "equals", type)
    .sort("Date", "descending")
    .all()
}

// Get project details with gallery
async function getProjectDetails(projectId: string) {
  const project = await cms.getRecord(projectId)

  // Get project images
  const gallery =
    project.advanced.Gallery?.map((img) => ({
      url: img.url,
      caption: img.caption || project.Name,
    })) || []

  // Get project description
  const descriptionBlocks = await cms.getPageContent(projectId)
  const description = cms.blocksToHtml(descriptionBlocks)

  return {
    ...project,
    gallery,
    description,
  }
}
```

## News/Press Releases

### News Listing

```typescript
// Get recent news
async function getRecentNews(limit = 10) {
  return await cms
    .query(process.env.NEWS_DATABASE_ID!)
    .filter("Status", "equals", "Published")
    .filter("PublishDate", "on_or_before", new Date())
    .sort("PublishDate", "descending")
    .limit(limit)
    .all()
}

// Get news by type
async function getNewsByType(type: string) {
  return await cms
    .query(process.env.NEWS_DATABASE_ID!)
    .filter("Status", "equals", "Published")
    .filter("Type", "equals", type)
    .sort("PublishDate", "descending")
    .all()
}

// Get press releases specifically
async function getPressReleases() {
  return await cms
    .query(process.env.NEWS_DATABASE_ID!)
    .filter("Status", "equals", "Published")
    .filter("Type", "equals", "Press Release")
    .sort("PublishDate", "descending")
    .all()
}
```

## Caching Patterns

### Simple Memory Cache

```typescript
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedData(key: string, fetchFn: () => Promise<any>) {
  const cached = cache.get(key)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const data = await fetchFn()
  cache.set(key, { data, timestamp: Date.now() })

  return data
}

// Usage
async function getCachedBlogPosts() {
  return getCachedData("blog-posts", () => getBlogPosts())
}
```

### Next.js Static Generation

```typescript
// pages/blog/[slug].tsx
export async function getStaticPaths() {
  const posts = await getBlogPosts()

  const paths = posts.results.map((post) => ({
    params: { slug: post.Slug },
  }))

  return { paths, fallback: "blocking" }
}

export async function getStaticProps({ params }) {
  const posts = await getBlogPosts()
  const post = posts.results.find((p) => p.Slug === params.slug)

  if (!post) {
    return { notFound: true }
  }

  const postWithContent = await getBlogPost(post.id)

  return {
    props: { post: postWithContent },
    revalidate: 3600, // Revalidate every hour
  }
}
```

## Error Handling Patterns

### Graceful Fallbacks

```typescript
async function getBlogPostsWithFallback() {
  try {
    return await getBlogPosts()
  } catch (error) {
    console.error("Failed to fetch blog posts:", error)

    // Return empty state instead of crashing
    return {
      results: [],
      hasMore: false,
      nextCursor: null,
    }
  }
}

// Fallback to cached data
async function getBlogPostsWithCache() {
  try {
    const posts = await getBlogPosts()
    // Cache successful results
    localStorage.setItem("cached-posts", JSON.stringify(posts))
    return posts
  } catch (error) {
    console.warn("Using cached posts due to error:", error)
    const cached = localStorage.getItem("cached-posts")
    return cached
      ? JSON.parse(cached)
      : { results: [], hasMore: false, nextCursor: null }
  }
}
```

These patterns provide a solid foundation for most content management use cases. Adapt them to your specific needs and database structure.
