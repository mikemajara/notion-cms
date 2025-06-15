# Real-World Use Cases

This guide demonstrates complete, production-ready implementations using Notion CMS for common scenarios like blogs, project management, and content systems.

## Blog Website Implementation

### Complete Blog System

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

class BlogSystem {
  private notionCms: NotionCMS;
  private BLOG_DB_ID: string;

  constructor(apiKey: string, blogDbId: string) {
    this.notionCms = new NotionCMS(apiKey);
    this.BLOG_DB_ID = blogDbId;
  }

  // Get published posts with pagination
  async getPublishedPosts(page: number = 1, pageSize: number = 10) {
    const { results, hasMore, nextCursor } = await this.notionCms
      .query(this.BLOG_DB_ID)
      .where("Status")
      .equals("Published")
      .sort("Publish Date", "descending")
      .paginate(pageSize);

    return {
      posts: results.map(this.formatBlogPost.bind(this)),
      pagination: { hasMore, nextCursor, page, pageSize },
    };
  }

  // Get single post by slug
  async getPostBySlug(slug: string) {
    const posts = await this.notionCms
      .query(this.BLOG_DB_ID)
      .where("Slug")
      .equals(slug)
      .where("Status")
      .equals("Published")
      .execute();

    if (posts.length === 0) return null;

    const post = posts[0];
    const content = await this.notionCms.getPageContent(post.id);

    return {
      ...this.formatBlogPost(post),
      content: this.notionCms.blocksToMarkdown(content.blocks),
      relatedPosts: await this.getRelatedPosts(post),
    };
  }

  // Get posts by category
  async getPostsByCategory(category: string) {
    return await this.notionCms
      .query(this.BLOG_DB_ID)
      .where("Category")
      .equals(category)
      .where("Status")
      .equals("Published")
      .sort("Publish Date", "descending")
      .execute();
  }

  // Search posts
  async searchPosts(searchTerm: string) {
    const allPosts = await this.notionCms
      .query(this.BLOG_DB_ID)
      .where("Status")
      .equals("Published")
      .all();

    return allPosts.filter((post) => {
      const searchText = [post.Title, post.Summary, ...(post.Tags || [])]
        .join(" ")
        .toLowerCase();

      return searchText.includes(searchTerm.toLowerCase());
    });
  }

  // Generate RSS feed
  async generateRSSFeed() {
    const posts = await this.notionCms
      .query(this.BLOG_DB_ID)
      .where("Status")
      .equals("Published")
      .sort("Publish Date", "descending")
      .paginate(20);

    const items = posts.results.map((post) => ({
      title: post.Title,
      link: `https://yourblog.com/posts/${post.Slug}`,
      description: post.Summary || "",
      pubDate: post.PublishDate?.toISOString(),
      category: post.Category,
      guid: post.id,
    }));

    return {
      title: "Your Blog",
      description: "Latest blog posts",
      link: "https://yourblog.com",
      items,
    };
  }

  private formatBlogPost(post: any) {
    return {
      id: post.id,
      title: post.Title,
      slug: post.Slug,
      summary: post.Summary,
      publishDate: post.PublishDate,
      category: post.Category,
      tags: post.Tags || [],
      author: post.Author?.[0] || "Anonymous",
      readingTime: this.calculateReadingTime(post.Content || ""),
      featured: post.Featured || false,
    };
  }

  private async getRelatedPosts(post: any, limit: number = 3) {
    if (!post.Tags || post.Tags.length === 0) return [];

    const related = await this.notionCms
      .query(this.BLOG_DB_ID)
      .where("Status")
      .equals("Published")
      .where("Tags")
      .contains(post.Tags[0])
      .sort("Publish Date", "descending")
      .execute();

    return related
      .filter((p) => p.id !== post.id)
      .slice(0, limit)
      .map(this.formatBlogPost.bind(this));
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}

// Usage
const blog = new BlogSystem(process.env.NOTION_API_KEY!, "blog-db-id");

// Get homepage posts
const homepagePosts = await blog.getPublishedPosts(1, 10);

// Get specific post
const post = await blog.getPostBySlug("my-first-post");

// Generate RSS
const rss = await blog.generateRSSFeed();
```

## Project Management Dashboard

### Task and Project Management

```typescript
class ProjectDashboard {
  private notionCms: NotionCMS;
  private PROJECTS_DB_ID: string;
  private TASKS_DB_ID: string;

  constructor(apiKey: string, projectsDbId: string, tasksDbId: string) {
    this.notionCms = new NotionCMS(apiKey);
    this.PROJECTS_DB_ID = projectsDbId;
    this.TASKS_DB_ID = tasksDbId;
  }

  // Get dashboard overview
  async getDashboardOverview() {
    const [projects, tasks] = await Promise.all([
      this.notionCms.getAllDatabaseRecords(this.PROJECTS_DB_ID),
      this.notionCms.getAllDatabaseRecords(this.TASKS_DB_ID),
    ]);

    const overview = {
      projects: {
        total: projects.length,
        active: projects.filter((p) => p.Status === "Active").length,
        completed: projects.filter((p) => p.Status === "Completed").length,
        onHold: projects.filter((p) => p.Status === "On Hold").length,
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter((t) => t.Completed).length,
        overdue: tasks.filter(
          (t) => t.DueDate && t.DueDate < new Date() && !t.Completed
        ).length,
        dueToday: tasks.filter(
          (t) => t.DueDate && this.isToday(t.DueDate) && !t.Completed
        ).length,
      },
    };

    return overview;
  }

  // Get project details with tasks
  async getProjectDetails(projectId: string) {
    const project = await this.notionCms.getRecord(projectId);

    const projectTasks = await this.notionCms
      .query(this.TASKS_DB_ID)
      .where("Project")
      .equals(project.Title)
      .sort("Priority", "descending")
      .execute();

    const taskStats = {
      total: projectTasks.length,
      completed: projectTasks.filter((t) => t.Completed).length,
      inProgress: projectTasks.filter(
        (t) => !t.Completed && t.Status === "In Progress"
      ).length,
      blocked: projectTasks.filter((t) => t.Status === "Blocked").length,
    };

    return {
      project,
      tasks: projectTasks,
      stats: {
        ...taskStats,
        completionRate:
          taskStats.total > 0
            ? (taskStats.completed / taskStats.total) * 100
            : 0,
      },
    };
  }

  // Get user tasks
  async getUserTasks(userName: string) {
    const userTasks = await this.notionCms
      .query(this.TASKS_DB_ID)
      .where("Assignee")
      .contains(userName)
      .where("Completed")
      .equals(false)
      .sort("Due Date", "ascending")
      .execute();

    return {
      overdue: userTasks.filter((t) => t.DueDate && t.DueDate < new Date()),
      dueToday: userTasks.filter((t) => t.DueDate && this.isToday(t.DueDate)),
      dueThisWeek: userTasks.filter(
        (t) => t.DueDate && this.isThisWeek(t.DueDate)
      ),
      backlog: userTasks.filter((t) => !t.DueDate),
    };
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isThisWeek(date: Date): boolean {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(
      today.setDate(today.getDate() - today.getDay() + 6)
    );
    return date >= weekStart && date <= weekEnd;
  }
}
```

## Content Management System

### Multi-Site CMS

```typescript
class ContentManagementSystem {
  private notionCms: NotionCMS;
  private PAGES_DB_ID: string;
  private MEDIA_DB_ID: string;

  constructor(apiKey: string, pagesDbId: string, mediaDbId: string) {
    this.notionCms = new NotionCMS(apiKey);
    this.PAGES_DB_ID = pagesDbId;
    this.MEDIA_DB_ID = mediaDbId;
  }

  // Get site navigation
  async getSiteNavigation() {
    const pages = await this.notionCms
      .query(this.PAGES_DB_ID)
      .where("Status")
      .equals("Published")
      .where("Show In Nav")
      .equals(true)
      .sort("Nav Order", "ascending")
      .execute();

    return pages.map((page) => ({
      title: page.Title,
      slug: page.Slug,
      order: page.NavOrder || 999,
      parentPage: page.ParentPage,
    }));
  }

  // Get page content
  async getPageContent(slug: string) {
    const pages = await this.notionCms
      .query(this.PAGES_DB_ID)
      .where("Slug")
      .equals(slug)
      .where("Status")
      .equals("Published")
      .execute();

    if (pages.length === 0) return null;

    const page = pages[0];
    const content = await this.notionCms.getPageContent(page.id);

    return {
      title: page.Title,
      slug: page.Slug,
      metaDescription: page.MetaDescription,
      content: this.notionCms.blocksToHtml(content.blocks),
      lastModified: page.LastModified,
      template: page.Template || "default",
    };
  }

  // Generate sitemap
  async generateSitemap() {
    const pages = await this.notionCms
      .query(this.PAGES_DB_ID)
      .where("Status")
      .equals("Published")
      .execute();

    return pages.map((page) => ({
      url: `https://yoursite.com/${page.Slug}`,
      lastmod: page.LastModified?.toISOString(),
      changefreq: this.getChangeFrequency(page.Type),
      priority: this.getPriority(page.Type),
    }));
  }

  private getChangeFrequency(pageType: string): string {
    const frequencies = {
      Homepage: "daily",
      Blog: "weekly",
      Product: "monthly",
      Static: "yearly",
    };
    return frequencies[pageType] || "monthly";
  }

  private getPriority(pageType: string): number {
    const priorities = {
      Homepage: 1.0,
      Blog: 0.8,
      Product: 0.9,
      Static: 0.5,
    };
    return priorities[pageType] || 0.5;
  }
}
```

## E-commerce Integration

### Product Catalog

```typescript
class ProductCatalog {
  private notionCms: NotionCMS;
  private PRODUCTS_DB_ID: string;

  constructor(apiKey: string, productsDbId: string) {
    this.notionCms = new NotionCMS(apiKey);
    this.PRODUCTS_DB_ID = productsDbId;
  }

  // Get product listing
  async getProducts(
    filters: {
      category?: string;
      priceRange?: { min: number; max: number };
      inStock?: boolean;
    } = {}
  ) {
    let query = this.notionCms
      .query(this.PRODUCTS_DB_ID)
      .where("Status")
      .equals("Active");

    if (filters.category) {
      query = query.where("Category").equals(filters.category);
    }

    if (filters.priceRange) {
      query = query
        .where("Price")
        .greaterThanOrEqualTo(filters.priceRange.min)
        .where("Price")
        .lessThanOrEqualTo(filters.priceRange.max);
    }

    if (filters.inStock) {
      query = query.where("Stock").greaterThan(0);
    }

    const products = await query
      .sort("Featured", "descending")
      .sort("Price", "ascending")
      .execute();

    return products.map(this.formatProduct.bind(this));
  }

  // Get single product
  async getProduct(productId: string) {
    const product = await this.notionCms.getRecord(productId);
    const content = await this.notionCms.getPageContent(productId);

    return {
      ...this.formatProduct(product),
      description: this.notionCms.blocksToHtml(content.blocks),
      specifications: this.extractSpecifications(content.blocks),
    };
  }

  private formatProduct(product: any) {
    return {
      id: product.id,
      name: product.Name,
      price: product.Price,
      salePrice: product.SalePrice,
      category: product.Category,
      brand: product.Brand,
      stock: product.Stock || 0,
      images: product.Images || [],
      featured: product.Featured || false,
      rating: product.Rating || 0,
      sku: product.SKU,
    };
  }

  private extractSpecifications(blocks: any[]): Record<string, string> {
    // Extract specifications from content blocks
    const specs = {};
    // Implementation would parse specific block patterns
    return specs;
  }
}
```

## Best Practices Summary

### Error Handling and Caching

```typescript
class ProductionNotionCMS {
  private notionCms: NotionCMS;
  private cache = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey: string) {
    this.notionCms = new NotionCMS(apiKey);
  }

  async getWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    timeout: number = this.cacheTimeout
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < timeout) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cached) {
        console.warn("Using expired cache due to error:", error.message);
        return cached.data;
      }
      throw error;
    }
  }

  async safeQuery(databaseId: string, queryFn: any) {
    const retries = 3;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        if (attempt === retries) throw error;

        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
```

## Usage in Different Frameworks

### Next.js Integration

```typescript
// pages/api/blog/[slug].ts
export default async function handler(req, res) {
  const { slug } = req.query;
  const blog = new BlogSystem(
    process.env.NOTION_API_KEY!,
    process.env.BLOG_DB_ID!
  );

  try {
    const post = await blog.getPostBySlug(slug as string);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
}
```

### Express.js API

```typescript
import express from "express";

const app = express();
const blog = new BlogSystem(
  process.env.NOTION_API_KEY!,
  process.env.BLOG_DB_ID!
);

app.get("/api/posts", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const posts = await blog.getPublishedPosts(page, 10);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/posts/:slug", async (req, res) => {
  try {
    const post = await blog.getPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

These real-world examples demonstrate production-ready patterns for common use cases. Each example includes error handling, caching, and proper data transformation suitable for production applications.

## Related Documentation

- **[Basic Usage](./basic-usage.md)** - Simple examples to get started
- **[Advanced Queries](./advanced-queries.md)** - Complex filtering patterns
- **[Layered API Examples](./layered-api-examples.md)** - Using all API layers effectively
