# Advanced Query Examples

This guide demonstrates advanced querying techniques, complex filtering patterns, and sophisticated data manipulation using Notion CMS's Query Builder and database operations.

## Setup

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!);

// Example database IDs
const BLOG_DB_ID = "your-blog-database-id";
const TASKS_DB_ID = "your-tasks-database-id";
const PROJECTS_DB_ID = "your-projects-database-id";
const ANALYTICS_DB_ID = "your-analytics-database-id";
```

## Complex Filtering Patterns

### Multi-Condition Queries

```typescript
// Find articles that are either high priority OR have specific tags AND are published
async function complexArticleQuery() {
  const articles = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Published")
    .and((builder) =>
      builder
        .where("Priority")
        .greaterThan(8)
        .or((subBuilder) =>
          subBuilder
            .where("Tags")
            .contains("Featured")
            .where("Category")
            .equals("Technical")
        )
    )
    .sort("Publish Date", "descending")
    .execute();

  console.log(`Found ${articles.length} high-value articles`);

  // Analyze the results
  const byPriority = articles.filter((a) => a.Priority && a.Priority > 8);
  const byTags = articles.filter(
    (a) => a.Tags?.includes("Featured") && a.Category === "Technical"
  );

  console.log(`  High priority: ${byPriority.length}`);
  console.log(`  Featured technical: ${byTags.length}`);

  return articles;
}
```

### Date Range Queries

```typescript
// Advanced date filtering with multiple conditions
async function dateRangeAnalysis() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Posts published last month
  const lastMonthPosts = await notionCms
    .query(BLOG_DB_ID)
    .where("Publish Date")
    .onOrAfter(lastMonth)
    .where("Publish Date")
    .before(thisMonth)
    .sort("Publish Date", "ascending")
    .execute();

  // Tasks due this month that aren't completed
  const thisMonthTasks = await notionCms
    .query(TASKS_DB_ID)
    .where("Due Date")
    .onOrAfter(thisMonth)
    .where("Due Date")
    .before(nextMonth)
    .where("Completed")
    .equals(false)
    .sort("Due Date", "ascending")
    .execute();

  // Projects created in the last 90 days
  const recentProjects = await notionCms
    .query(PROJECTS_DB_ID)
    .where("Created Date")
    .onOrAfter(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
    .sort("Created Date", "descending")
    .execute();

  console.log("Date Range Analysis:");
  console.log(`  Posts published last month: ${lastMonthPosts.length}`);
  console.log(`  Tasks due this month: ${thisMonthTasks.length}`);
  console.log(`  Projects created in last 90 days: ${recentProjects.length}`);

  // Calculate publishing frequency
  const publishingDays = new Set(
    lastMonthPosts.map((post) => post.PublishDate?.toISOString().split("T")[0])
  ).size;

  console.log(`  Active publishing days last month: ${publishingDays}`);

  return {
    lastMonthPosts,
    thisMonthTasks,
    recentProjects,
  };
}
```

### Text Search Patterns

```typescript
// Advanced text filtering (client-side search since Notion API doesn't support full-text search)
async function advancedTextSearch(
  searchTerms: string[],
  categories?: string[]
) {
  // Get all published posts
  let query = notionCms.query(BLOG_DB_ID).where("Status").equals("Published");

  // Add category filter if specified
  if (categories && categories.length > 0) {
    query = query.and((builder) => {
      categories.forEach((category, index) => {
        if (index === 0) {
          builder.where("Category").equals(category);
        } else {
          builder.or("Category").equals(category);
        }
      });
      return builder;
    });
  }

  const allPosts = await query.all();

  // Client-side text search across multiple fields
  const searchResults = allPosts.filter((post) => {
    const searchableText = [
      post.Title,
      post.Content,
      post.Summary,
      ...(post.Tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchTerms.every((term) =>
      searchableText.includes(term.toLowerCase())
    );
  });

  // Rank results by relevance
  const rankedResults = searchResults
    .map((post) => {
      const text = [
        post.Title,
        post.Content,
        post.Summary,
        ...(post.Tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let score = 0;
      searchTerms.forEach((term) => {
        const termLower = term.toLowerCase();
        // Title matches are worth more
        if (post.Title?.toLowerCase().includes(termLower)) score += 10;
        // Tag matches are worth more
        if (post.Tags?.some((tag) => tag.toLowerCase().includes(termLower)))
          score += 5;
        // Count occurrences in content
        const matches = (text.match(new RegExp(termLower, "g")) || []).length;
        score += matches;
      });

      return { ...post, searchScore: score };
    })
    .sort((a, b) => b.searchScore - a.searchScore);

  console.log(`Advanced search for "${searchTerms.join(", ")}":`);
  console.log(`  Found ${rankedResults.length} results`);

  // Show top results
  rankedResults.slice(0, 5).forEach((post, index) => {
    console.log(`  ${index + 1}. ${post.Title} (score: ${post.searchScore})`);
  });

  return rankedResults;
}
```

### Relationship Queries

```typescript
// Query related data across databases
async function relationshipAnalysis() {
  // Get all projects with their associated tasks
  const projects = await notionCms.getAllDatabaseRecords(PROJECTS_DB_ID);

  const projectAnalysis = await Promise.all(
    projects.map(async (project) => {
      // Find tasks related to this project
      const projectTasks = await notionCms
        .query(TASKS_DB_ID)
        .where("Project")
        .equals(project.Title) // Assuming tasks reference project by name
        .execute();

      // Find blog posts about this project
      const projectPosts = await notionCms
        .query(BLOG_DB_ID)
        .where("Tags")
        .contains(project.Title)
        .where("Status")
        .equals("Published")
        .execute();

      const completedTasks = projectTasks.filter((task) => task.Completed);
      const pendingTasks = projectTasks.filter((task) => !task.Completed);
      const overdueTasks = projectTasks.filter(
        (task) => task.DueDate && task.DueDate < new Date() && !task.Completed
      );

      return {
        project,
        tasks: {
          total: projectTasks.length,
          completed: completedTasks.length,
          pending: pendingTasks.length,
          overdue: overdueTasks.length,
          completionRate:
            projectTasks.length > 0
              ? (completedTasks.length / projectTasks.length) * 100
              : 0,
        },
        posts: projectPosts.length,
        lastActivity: Math.max(
          ...projectTasks.map((t) => t.UpdatedDate?.getTime() || 0),
          ...projectPosts.map((p) => p.PublishDate?.getTime() || 0)
        ),
      };
    })
  );

  // Sort by activity
  projectAnalysis.sort((a, b) => b.lastActivity - a.lastActivity);

  console.log("Project Relationship Analysis:");
  projectAnalysis.forEach((analysis) => {
    const { project, tasks, posts, lastActivity } = analysis;
    const lastActivityDate = new Date(lastActivity).toLocaleDateString();

    console.log(`\n${project.Title}:`);
    console.log(
      `  Tasks: ${tasks.total} (${tasks.completed} completed, ${tasks.overdue} overdue)`
    );
    console.log(`  Completion: ${tasks.completionRate.toFixed(1)}%`);
    console.log(`  Blog posts: ${posts}`);
    console.log(`  Last activity: ${lastActivityDate}`);
  });

  return projectAnalysis;
}
```

## Aggregation and Analytics

### Statistical Analysis

```typescript
// Perform statistical analysis on data
async function performStatisticalAnalysis() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);
  const tasks = await notionCms.getAllDatabaseRecords(TASKS_DB_ID);

  // Blog post statistics
  const postStats = {
    total: posts.length,
    published: posts.filter((p) => p.Status === "Published").length,

    // Priority analysis
    priorities: posts
      .map((p) => p.Priority)
      .filter((p): p is number => typeof p === "number"),

    // Content length analysis
    contentLengths: posts
      .map((p) => p.Content?.length || 0)
      .filter((length) => length > 0),

    // Tag frequency
    tagFrequency: new Map<string, number>(),

    // Publishing patterns
    publishingByMonth: new Map<string, number>(),
    publishingByDay: new Map<string, number>(),
  };

  // Calculate tag frequency
  posts.forEach((post) => {
    post.Tags?.forEach((tag) => {
      postStats.tagFrequency.set(
        tag,
        (postStats.tagFrequency.get(tag) || 0) + 1
      );
    });
  });

  // Calculate publishing patterns
  posts.forEach((post) => {
    if (post.PublishDate) {
      const month = post.PublishDate.toISOString().substring(0, 7); // YYYY-MM
      const day = post.PublishDate.getDay(); // 0-6 (Sunday-Saturday)

      postStats.publishingByMonth.set(
        month,
        (postStats.publishingByMonth.get(month) || 0) + 1
      );

      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
      postStats.publishingByDay.set(
        dayName,
        (postStats.publishingByDay.get(dayName) || 0) + 1
      );
    }
  });

  // Statistical calculations
  const priorityStats = calculateStats(postStats.priorities);
  const contentStats = calculateStats(postStats.contentLengths);

  console.log("Blog Statistics:");
  console.log(`  Total posts: ${postStats.total}`);
  console.log(
    `  Published: ${postStats.published} (${(
      (postStats.published / postStats.total) *
      100
    ).toFixed(1)}%)`
  );

  if (priorityStats) {
    console.log(
      `  Priority - Mean: ${priorityStats.mean.toFixed(2)}, Median: ${
        priorityStats.median
      }, Std: ${priorityStats.stdDev.toFixed(2)}`
    );
  }

  if (contentStats) {
    console.log(
      `  Content length - Mean: ${contentStats.mean.toFixed(
        0
      )} chars, Median: ${contentStats.median} chars`
    );
  }

  // Top tags
  const topTags = Array.from(postStats.tagFrequency.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  console.log(
    `  Top tags: ${topTags
      .map(([tag, count]) => `${tag}(${count})`)
      .join(", ")}`
  );

  // Publishing patterns
  console.log("  Publishing by day:");
  Array.from(postStats.publishingByDay.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([day, count]) => {
      console.log(`    ${day}: ${count}`);
    });

  return { postStats, priorityStats, contentStats };
}

function calculateStats(numbers: number[]) {
  if (numbers.length === 0) return null;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance =
    numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: numbers.length,
  };
}
```

### Time Series Analysis

```typescript
// Analyze trends over time
async function timeSeriesAnalysis() {
  const posts = await notionCms
    .query(BLOG_DB_ID)
    .where("Status")
    .equals("Published")
    .where("Publish Date")
    .isNotEmpty()
    .sort("Publish Date", "ascending")
    .all();

  // Group by month
  const monthlyData = new Map<
    string,
    {
      count: number;
      totalPriority: number;
      avgPriority: number;
      tags: Set<string>;
    }
  >();

  posts.forEach((post) => {
    if (!post.PublishDate) return;

    const month = post.PublishDate.toISOString().substring(0, 7);
    const existing = monthlyData.get(month) || {
      count: 0,
      totalPriority: 0,
      avgPriority: 0,
      tags: new Set(),
    };

    existing.count++;
    if (post.Priority) {
      existing.totalPriority += post.Priority;
    }

    post.Tags?.forEach((tag) => existing.tags.add(tag));

    monthlyData.set(month, existing);
  });

  // Calculate averages and trends
  const monthlyStats = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      posts: data.count,
      avgPriority: data.totalPriority / data.count || 0,
      uniqueTags: data.tags.size,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  console.log("Monthly Publishing Trends:");
  monthlyStats.forEach((stat) => {
    console.log(
      `  ${stat.month}: ${
        stat.posts
      } posts, avg priority: ${stat.avgPriority.toFixed(2)}, ${
        stat.uniqueTags
      } unique tags`
    );
  });

  // Calculate growth rates
  const growthRates = monthlyStats.slice(1).map((current, index) => {
    const previous = monthlyStats[index];
    const growth = ((current.posts - previous.posts) / previous.posts) * 100;
    return {
      month: current.month,
      growth: growth.toFixed(1) + "%",
    };
  });

  console.log("\nMonth-over-month growth:");
  growthRates.slice(-6).forEach((rate) => {
    console.log(`  ${rate.month}: ${rate.growth}`);
  });

  return { monthlyStats, growthRates };
}
```

### Performance Metrics

```typescript
// Calculate performance metrics across different dimensions
async function calculatePerformanceMetrics() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);
  const tasks = await notionCms.getAllDatabaseRecords(TASKS_DB_ID);

  // Content performance metrics
  const contentMetrics = {
    totalPosts: posts.length,
    publishRate: 0,
    averageQuality: 0,
    categoryDistribution: new Map<string, number>(),
    authorProductivity: new Map<string, number>(),
  };

  // Calculate publish rate (posts per month)
  const publishedPosts = posts.filter(
    (p) => p.Status === "Published" && p.PublishDate
  );
  if (publishedPosts.length > 0) {
    const oldestPost = Math.min(
      ...publishedPosts.map((p) => p.PublishDate!.getTime())
    );
    const newestPost = Math.max(
      ...publishedPosts.map((p) => p.PublishDate!.getTime())
    );
    const monthsSpan = (newestPost - oldestPost) / (1000 * 60 * 60 * 24 * 30);
    contentMetrics.publishRate =
      publishedPosts.length / Math.max(monthsSpan, 1);
  }

  // Calculate average quality (based on priority)
  const qualityScores = posts
    .map((p) => p.Priority)
    .filter((p): p is number => typeof p === "number");
  if (qualityScores.length > 0) {
    contentMetrics.averageQuality =
      qualityScores.reduce((sum, p) => sum + p, 0) / qualityScores.length;
  }

  // Category distribution
  posts.forEach((post) => {
    if (post.Category) {
      contentMetrics.categoryDistribution.set(
        post.Category,
        (contentMetrics.categoryDistribution.get(post.Category) || 0) + 1
      );
    }
  });

  // Author productivity
  posts.forEach((post) => {
    post.Author?.forEach((author) => {
      contentMetrics.authorProductivity.set(
        author,
        (contentMetrics.authorProductivity.get(author) || 0) + 1
      );
    });
  });

  // Task performance metrics
  const taskMetrics = {
    totalTasks: tasks.length,
    completionRate: 0,
    averageTimeToComplete: 0,
    onTimeCompletionRate: 0,
  };

  const completedTasks = tasks.filter((t) => t.Completed);
  taskMetrics.completionRate = (completedTasks.length / tasks.length) * 100;

  // Calculate on-time completion rate
  const tasksWithDueDate = tasks.filter((t) => t.DueDate);
  const onTimeTasks = tasksWithDueDate.filter(
    (t) =>
      t.Completed &&
      t.CompletedDate &&
      t.DueDate &&
      t.CompletedDate <= t.DueDate
  );
  taskMetrics.onTimeCompletionRate =
    tasksWithDueDate.length > 0
      ? (onTimeTasks.length / tasksWithDueDate.length) * 100
      : 0;

  console.log("Performance Metrics:");
  console.log("\nContent Metrics:");
  console.log(`  Total posts: ${contentMetrics.totalPosts}`);
  console.log(
    `  Publish rate: ${contentMetrics.publishRate.toFixed(2)} posts/month`
  );
  console.log(
    `  Average quality: ${contentMetrics.averageQuality.toFixed(2)}/10`
  );

  console.log("\nTop categories:");
  Array.from(contentMetrics.categoryDistribution.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([category, count]) => {
      console.log(`    ${category}: ${count} posts`);
    });

  console.log("\nTop authors:");
  Array.from(contentMetrics.authorProductivity.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([author, count]) => {
      console.log(`    ${author}: ${count} posts`);
    });

  console.log("\nTask Metrics:");
  console.log(`  Total tasks: ${taskMetrics.totalTasks}`);
  console.log(`  Completion rate: ${taskMetrics.completionRate.toFixed(1)}%`);
  console.log(
    `  On-time completion: ${taskMetrics.onTimeCompletionRate.toFixed(1)}%`
  );

  return { contentMetrics, taskMetrics };
}
```

## Dynamic Query Building

### Conditional Query Builder

```typescript
// Build queries dynamically based on conditions
async function buildDynamicQuery(filters: {
  status?: string[];
  priority?: { min?: number; max?: number };
  tags?: string[];
  dateRange?: { start?: Date; end?: Date };
  author?: string[];
  categories?: string[];
}) {
  let query = notionCms.query(BLOG_DB_ID);

  // Add status filter
  if (filters.status && filters.status.length > 0) {
    if (filters.status.length === 1) {
      query = query.where("Status").equals(filters.status[0]);
    } else {
      query = query.and((builder) => {
        filters.status!.forEach((status, index) => {
          if (index === 0) {
            builder.where("Status").equals(status);
          } else {
            builder.or("Status").equals(status);
          }
        });
        return builder;
      });
    }
  }

  // Add priority range filter
  if (filters.priority) {
    if (filters.priority.min !== undefined) {
      query = query
        .where("Priority")
        .greaterThanOrEqualTo(filters.priority.min);
    }
    if (filters.priority.max !== undefined) {
      query = query.where("Priority").lessThanOrEqualTo(filters.priority.max);
    }
  }

  // Add tag filters (posts must have ALL specified tags)
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag) => {
      query = query.where("Tags").contains(tag);
    });
  }

  // Add date range filter
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      query = query.where("Publish Date").onOrAfter(filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      query = query.where("Publish Date").onOrBefore(filters.dateRange.end);
    }
  }

  // Add author filter
  if (filters.author && filters.author.length > 0) {
    query = query.and((builder) => {
      filters.author!.forEach((author, index) => {
        if (index === 0) {
          builder.where("Author").contains(author);
        } else {
          builder.or("Author").contains(author);
        }
      });
      return builder;
    });
  }

  // Add category filter
  if (filters.categories && filters.categories.length > 0) {
    query = query.and((builder) => {
      filters.categories!.forEach((category, index) => {
        if (index === 0) {
          builder.where("Category").equals(category);
        } else {
          builder.or("Category").equals(category);
        }
      });
      return builder;
    });
  }

  const results = await query.sort("Publish Date", "descending").execute();

  console.log(`Dynamic query returned ${results.length} results`);
  console.log("Applied filters:", JSON.stringify(filters, null, 2));

  return results;
}

// Usage examples
async function dynamicQueryExamples() {
  // High priority posts from this year
  const highPriorityPosts = await buildDynamicQuery({
    status: ["Published"],
    priority: { min: 8 },
    dateRange: { start: new Date("2024-01-01") },
  });

  // React or TypeScript posts by specific authors
  const techPosts = await buildDynamicQuery({
    status: ["Published", "Featured"],
    tags: ["React", "TypeScript"],
    author: ["John Doe", "Jane Smith"],
    categories: ["Technical", "Tutorial"],
  });

  // Recent drafts that need attention
  const recentDrafts = await buildDynamicQuery({
    status: ["Draft"],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    },
  });

  return { highPriorityPosts, techPosts, recentDrafts };
}
```

### Query Templates

```typescript
// Predefined query templates for common use cases
class QueryTemplates {
  private notionCms: NotionCMS;

  constructor(notionCms: NotionCMS) {
    this.notionCms = notionCms;
  }

  // Get trending content (high priority, recent, with engagement)
  async getTrendingContent(databaseId: string) {
    return await this.notionCms
      .query(databaseId)
      .where("Status")
      .equals("Published")
      .where("Priority")
      .greaterThan(7)
      .where("Publish Date")
      .onOrAfter(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .sort("Priority", "descending")
      .sort("Publish Date", "descending")
      .execute();
  }

  // Get content that needs review
  async getContentNeedingReview(databaseId: string) {
    return await this.notionCms
      .query(databaseId)
      .where("Status")
      .equals("In Review")
      .or("Status")
      .equals("Draft")
      .where("Updated Date")
      .before(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort("Updated Date", "ascending")
      .execute();
  }

  // Get author performance data
  async getAuthorPerformance(databaseId: string, authorName: string) {
    const posts = await this.notionCms
      .query(databaseId)
      .where("Author")
      .contains(authorName)
      .where("Status")
      .equals("Published")
      .sort("Publish Date", "descending")
      .all();

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthPosts = posts.filter(
      (p) => p.PublishDate && p.PublishDate >= thisMonth
    );

    const avgPriority = posts
      .map((p) => p.Priority)
      .filter((p): p is number => typeof p === "number")
      .reduce((sum, p, _, arr) => sum + p / arr.length, 0);

    return {
      totalPosts: posts.length,
      thisMonthPosts: thisMonthPosts.length,
      averagePriority: avgPriority,
      recentPosts: posts.slice(0, 5),
      topTags: this.getTopTags(posts),
    };
  }

  // Get content gaps analysis
  async getContentGaps(databaseId: string) {
    const allPosts = await this.notionCms.getAllDatabaseRecords(databaseId);

    // Analyze category distribution
    const categoryCount = new Map<string, number>();
    const tagCount = new Map<string, number>();

    allPosts.forEach((post) => {
      if (post.Category) {
        categoryCount.set(
          post.Category,
          (categoryCount.get(post.Category) || 0) + 1
        );
      }

      post.Tags?.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    // Find under-represented categories
    const avgCategorySize = Array.from(categoryCount.values()).reduce(
      (sum, count, _, arr) => sum + count / arr.length,
      0
    );

    const underRepresented = Array.from(categoryCount.entries())
      .filter(([, count]) => count < avgCategorySize * 0.5)
      .sort(([, a], [, b]) => a - b);

    return {
      totalPosts: allPosts.length,
      categories: categoryCount.size,
      averageCategorySize: Math.round(avgCategorySize),
      underRepresentedCategories: underRepresented,
      topCategories: Array.from(categoryCount.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      rareTags: Array.from(tagCount.entries())
        .filter(([, count]) => count === 1)
        .map(([tag]) => tag),
    };
  }

  private getTopTags(posts: any[]): string[] {
    const tagCount = new Map<string, number>();
    posts.forEach((post) => {
      post.Tags?.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  }
}

// Usage
const templates = new QueryTemplates(notionCms);

async function useQueryTemplates() {
  const trending = await templates.getTrendingContent(BLOG_DB_ID);
  const needsReview = await templates.getContentNeedingReview(BLOG_DB_ID);
  const authorPerf = await templates.getAuthorPerformance(
    BLOG_DB_ID,
    "John Doe"
  );
  const gaps = await templates.getContentGaps(BLOG_DB_ID);

  console.log("Query Templates Results:");
  console.log(`  Trending content: ${trending.length} posts`);
  console.log(`  Needs review: ${needsReview.length} posts`);
  console.log(
    `  Author performance: ${authorPerf.totalPosts} total, ${authorPerf.thisMonthPosts} this month`
  );
  console.log(
    `  Content gaps: ${gaps.underRepresentedCategories.length} under-represented categories`
  );
}
```

## Performance Optimization

### Efficient Batch Processing

```typescript
// Process large datasets efficiently
async function efficientBatchProcessing() {
  const BATCH_SIZE = 50;
  const DELAY_MS = 100;

  async function processBatchWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error("All attempts failed");
  }

  async function processAllData(databaseId: string) {
    let allResults: any[] = [];
    let hasMore = true;
    let nextCursor: string | null = null;
    let batchNumber = 1;

    while (hasMore) {
      console.log(`Processing batch ${batchNumber}...`);

      const batch = await processBatchWithRetry(async () => {
        return await notionCms.getDatabase(databaseId, {
          pageSize: BATCH_SIZE,
          startCursor: nextCursor,
        });
      });

      allResults.push(...batch.results);
      hasMore = batch.hasMore;
      nextCursor = batch.nextCursor;
      batchNumber++;

      // Process each record in the batch
      await processBatch(batch.results);

      // Rate limiting
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log(
      `Processed ${allResults.length} total records in ${
        batchNumber - 1
      } batches`
    );
    return allResults;
  }

  async function processBatch(records: any[]) {
    // Example processing: analyze and categorize
    const analysis = {
      highPriority: 0,
      needsAttention: 0,
      completed: 0,
    };

    records.forEach((record) => {
      if (record.Priority && record.Priority > 8) {
        analysis.highPriority++;
      }

      if (record.Status === "Draft" && record.CreatedDate) {
        const daysOld =
          (Date.now() - record.CreatedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld > 7) {
          analysis.needsAttention++;
        }
      }

      if (record.Status === "Published" || record.Completed) {
        analysis.completed++;
      }
    });

    console.log(
      `  Batch analysis: ${analysis.highPriority} high priority, ${analysis.needsAttention} need attention, ${analysis.completed} completed`
    );
  }

  return await processAllData(BLOG_DB_ID);
}
```

### Parallel Query Execution

```typescript
// Execute multiple queries in parallel for better performance
async function parallelQueryExecution() {
  console.log("Starting parallel query execution...");
  const startTime = Date.now();

  // Execute multiple queries simultaneously
  const [
    publishedPosts,
    draftPosts,
    highPriorityTasks,
    recentProjects,
    topAuthors,
  ] = await Promise.all([
    // Published blog posts
    notionCms
      .query(BLOG_DB_ID)
      .where("Status")
      .equals("Published")
      .sort("Publish Date", "descending")
      .paginate(20),

    // Draft posts needing attention
    notionCms
      .query(BLOG_DB_ID)
      .where("Status")
      .equals("Draft")
      .where("Created Date")
      .before(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .execute(),

    // High priority tasks
    notionCms
      .query(TASKS_DB_ID)
      .where("Priority")
      .greaterThan(8)
      .where("Completed")
      .equals(false)
      .execute(),

    // Recent projects
    notionCms
      .query(PROJECTS_DB_ID)
      .where("Created Date")
      .onOrAfter(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .execute(),

    // Author productivity analysis
    (async () => {
      const allPosts = await notionCms
        .query(BLOG_DB_ID)
        .where("Status")
        .equals("Published")
        .all();

      const authorCount = new Map<string, number>();
      allPosts.forEach((post) => {
        post.Author?.forEach((author) => {
          authorCount.set(author, (authorCount.get(author) || 0) + 1);
        });
      });

      return Array.from(authorCount.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    })(),
  ]);

  const executionTime = Date.now() - startTime;

  console.log(`Parallel execution completed in ${executionTime}ms`);
  console.log("Results:");
  console.log(`  Published posts: ${publishedPosts.results.length}`);
  console.log(`  Old drafts: ${draftPosts.length}`);
  console.log(`  High priority tasks: ${highPriorityTasks.length}`);
  console.log(`  Recent projects: ${recentProjects.length}`);
  console.log(
    `  Top authors: ${topAuthors
      .map(([name, count]) => `${name}(${count})`)
      .join(", ")}`
  );

  return {
    publishedPosts: publishedPosts.results,
    draftPosts,
    highPriorityTasks,
    recentProjects,
    topAuthors,
    executionTime,
  };
}
```

## Usage Examples

Run these advanced query examples:

```typescript
async function runAdvancedExamples() {
  console.log("Advanced Query Examples");
  console.log("======================");

  // Complex filtering
  await complexArticleQuery();

  // Date range analysis
  await dateRangeAnalysis();

  // Text search
  await advancedTextSearch(["React", "performance"], ["Technical"]);

  // Statistical analysis
  await performStatisticalAnalysis();

  // Time series analysis
  await timeSeriesAnalysis();

  // Performance metrics
  await calculatePerformanceMetrics();

  // Dynamic queries
  await dynamicQueryExamples();

  // Query templates
  await useQueryTemplates();

  // Parallel execution
  await parallelQueryExecution();

  // Batch processing
  await efficientBatchProcessing();
}

// Run all examples
runAdvancedExamples().catch(console.error);
```

## Next Steps

- **[Layered API Examples](./layered-api-examples.md)** - Using Simple, Advanced, and Raw APIs together
- **[Real-World Use Cases](./real-world-use-cases.md)** - Complete application implementations
- **[Query Builder Reference](../api-reference/query-builder.md)** - Complete API documentation
