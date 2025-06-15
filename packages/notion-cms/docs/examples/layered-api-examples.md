# Layered API Examples

This guide demonstrates how to effectively use Notion CMS's three API layers (Simple, Advanced, and Raw) to handle different scenarios. Understanding when and how to use each layer is key to building robust applications.

## API Layer Overview

Notion CMS provides three layers of data access:

1. **Simple API** - Clean JavaScript types, perfect for business logic
2. **Advanced API** - Rich metadata with formatting, colors, and detailed information
3. **Raw API** - Complete unmodified Notion API response for maximum flexibility

## Setup

```typescript
import { NotionCMS } from "@mikemajara/notion-cms";

const notionCms = new NotionCMS(process.env.NOTION_API_KEY!);

// Example database IDs
const BLOG_DB_ID = "your-blog-database-id";
const TASKS_DB_ID = "your-tasks-database-id";
```

## Simple API Examples

### Basic Data Operations

```typescript
// Use Simple API for straightforward data operations
async function simpleDataOperations() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  console.log("Simple API - Perfect for business logic:");

  // Direct property access
  posts.forEach((post) => {
    console.log(`Title: ${post.Title}`); // string
    console.log(`Status: ${post.Status}`); // string
    console.log(`Tags: ${post.Tags?.join(", ") || "None"}`); // string[]
    console.log(`Priority: ${post.Priority || 0}`); // number | null
    console.log(
      `Published: ${post.PublishDate?.toLocaleDateString() || "Not published"}`
    ); // Date | null
    console.log("---");
  });

  // Simple filtering and calculations
  const publishedPosts = posts.filter((post) => post.Status === "Published");
  const averagePriority = publishedPosts
    .map((post) => post.Priority || 0)
    .reduce((sum, priority, _, arr) => sum + priority / arr.length, 0);

  console.log(`Published posts: ${publishedPosts.length}`);
  console.log(`Average priority: ${averagePriority.toFixed(2)}`);

  return posts;
}
```

### Business Logic Implementation

```typescript
// Simple API excels at business logic
async function implementBusinessLogic() {
  const tasks = await notionCms.getAllDatabaseRecords(TASKS_DB_ID);

  // Task categorization using simple, clean data
  const taskCategories = {
    overdue: tasks.filter(
      (task) => task.DueDate && task.DueDate < new Date() && !task.Completed
    ),
    urgent: tasks.filter(
      (task) => task.Priority && task.Priority > 8 && !task.Completed
    ),
    upcoming: tasks.filter((task) => {
      if (!task.DueDate || task.Completed) return false;
      const daysUntilDue =
        (task.DueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilDue <= 3 && daysUntilDue > 0;
    }),
    lowPriority: tasks.filter(
      (task) =>
        !task.Completed &&
        (!task.Priority || task.Priority <= 3) &&
        (!task.DueDate || task.DueDate > new Date())
    ),
  };

  console.log("Task Analysis (Simple API):");
  console.log(`  Overdue: ${taskCategories.overdue.length}`);
  console.log(`  Urgent: ${taskCategories.urgent.length}`);
  console.log(`  Due soon: ${taskCategories.upcoming.length}`);
  console.log(`  Low priority: ${taskCategories.lowPriority.length}`);

  // Generate recommendations
  const recommendations = [];
  if (taskCategories.overdue.length > 0) {
    recommendations.push(
      `Address ${taskCategories.overdue.length} overdue tasks immediately`
    );
  }
  if (taskCategories.urgent.length > 5) {
    recommendations.push(
      "Too many urgent tasks - consider delegating or reprioritizing"
    );
  }
  if (taskCategories.upcoming.length > 0) {
    recommendations.push(
      `Prepare for ${taskCategories.upcoming.length} tasks due in the next 3 days`
    );
  }

  console.log("\nRecommendations:");
  recommendations.forEach((rec) => console.log(`  - ${rec}`));

  return taskCategories;
}
```

## Advanced API Examples

### Rich Text Formatting

```typescript
// Use Advanced API for rich text and formatting
async function handleRichTextFormatting() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  console.log("Advanced API - Rich text and formatting:");

  posts.slice(0, 3).forEach((post) => {
    console.log(`\nPost: ${post.Title}`);

    // Simple API for basic content
    console.log(
      `Content (Simple): ${(post.Content || "").substring(0, 100)}...`
    );

    // Advanced API for rich formatting
    if (post.advanced?.Content) {
      console.log("Content with formatting:");

      const formattedContent = post.advanced.Content.map((richText) => {
        let text = richText.plain_text;
        const annotations = richText.annotations;

        // Apply formatting markers
        if (annotations?.bold) text = `**${text}**`;
        if (annotations?.italic) text = `*${text}*`;
        if (annotations?.strikethrough) text = `~~${text}~~`;
        if (annotations?.code) text = `\`${text}\``;
        if (annotations?.underline) text = `<u>${text}</u>`;

        // Handle links
        if (richText.href) {
          text = `[${text}](${richText.href})`;
        }

        // Handle colors
        if (annotations?.color && annotations.color !== "default") {
          text = `<span style="color: ${annotations.color}">${text}</span>`;
        }

        return text;
      }).join("");

      console.log(`Formatted: ${formattedContent.substring(0, 200)}...`);

      // Extract formatting statistics
      const hasFormatting = post.advanced.Content.some((text) =>
        Object.values(text.annotations || {}).some((value) => value === true)
      );
      const hasLinks = post.advanced.Content.some((text) => text.href);
      const hasColors = post.advanced.Content.some(
        (text) =>
          text.annotations?.color && text.annotations.color !== "default"
      );

      console.log(`  Has formatting: ${hasFormatting}`);
      console.log(`  Has links: ${hasLinks}`);
      console.log(`  Has colors: ${hasColors}`);
    }
  });
}
```

### Property Metadata and Styling

```typescript
// Use Advanced API for property metadata like colors and options
async function handlePropertyMetadata() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  console.log("Advanced API - Property metadata and styling:");

  posts.slice(0, 5).forEach((post) => {
    console.log(`\nPost: ${post.Title}`);

    // Status with color information
    if (post.advanced?.Status) {
      const statusInfo = post.advanced.Status;
      console.log(`Status: ${statusInfo.name} (color: ${statusInfo.color})`);

      // Generate CSS class based on status color
      const cssClass = `status-${statusInfo.color}`;
      console.log(`CSS class: ${cssClass}`);
    }

    // Tags with color information
    if (post.advanced?.Tags && post.advanced.Tags.length > 0) {
      console.log("Tags with colors:");
      post.advanced.Tags.forEach((tag) => {
        console.log(`  - ${tag.name} (${tag.color})`);
      });

      // Generate tag HTML with colors
      const tagHtml = post.advanced.Tags.map(
        (tag) =>
          `<span class="tag tag-${tag.color}" data-tag="${tag.name}">${tag.name}</span>`
      ).join(" ");
      console.log(`Tag HTML: ${tagHtml}`);
    }

    // People with avatar information
    if (post.advanced?.Author && post.advanced.Author.length > 0) {
      console.log("Authors with details:");
      post.advanced.Author.forEach((author) => {
        console.log(`  - ${author.name}`);
        if (author.avatar_url) {
          console.log(`    Avatar: ${author.avatar_url}`);
        }
        if (author.person?.email) {
          console.log(`    Email: ${author.person.email}`);
        }
      });
    }
  });
}
```

### UI Component Generation

```typescript
// Use Advanced API to generate rich UI components
async function generateUIComponents() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  console.log("Advanced API - UI component generation:");

  // Generate blog post cards with rich metadata
  const blogCards = posts.slice(0, 3).map((post) => {
    const card = {
      id: post.id,
      title: post.Title,
      excerpt: (post.Content || "").substring(0, 150) + "...",
      publishDate: post.PublishDate?.toLocaleDateString(),
      readingTime: estimateReadingTime(post.Content || ""),
      status: {
        text: post.Status,
        color: post.advanced?.Status?.color || "gray",
        cssClass: `status-${post.advanced?.Status?.color || "gray"}`,
      },
      tags: (post.advanced?.Tags || []).map((tag) => ({
        name: tag.name,
        color: tag.color,
        cssClass: `tag-${tag.color}`,
      })),
      authors: (post.advanced?.Author || []).map((author) => ({
        name: author.name,
        avatar: author.avatar_url,
        email: author.person?.email,
      })),
      priority: {
        level: post.Priority || 0,
        label: getPriorityLabel(post.Priority || 0),
        cssClass: getPriorityCssClass(post.Priority || 0),
      },
    };

    return card;
  });

  // Generate HTML for blog cards
  const htmlCards = blogCards
    .map(
      (card) => `
    <div class="blog-card" data-id="${card.id}">
      <div class="blog-card-header">
        <h3 class="blog-card-title">${card.title}</h3>
        <span class="blog-card-status ${card.status.cssClass}">${
        card.status.text
      }</span>
      </div>
      
      <div class="blog-card-meta">
        <span class="publish-date">${card.publishDate || "Not published"}</span>
        <span class="reading-time">${card.readingTime} min read</span>
        <span class="priority ${card.priority.cssClass}">${
        card.priority.label
      }</span>
      </div>
      
      <p class="blog-card-excerpt">${card.excerpt}</p>
      
      <div class="blog-card-tags">
        ${card.tags
          .map((tag) => `<span class="tag ${tag.cssClass}">${tag.name}</span>`)
          .join("")}
      </div>
      
      <div class="blog-card-authors">
        ${card.authors
          .map(
            (author) => `
          <div class="author">
            ${
              author.avatar
                ? `<img src="${author.avatar}" alt="${author.name}" class="author-avatar">`
                : `<div class="author-avatar-placeholder">${author.name.charAt(
                    0
                  )}</div>`
            }
            <span class="author-name">${author.name}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `
    )
    .join("\n");

  console.log("Generated HTML components:");
  console.log(htmlCards);

  return blogCards;
}

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function getPriorityLabel(priority: number): string {
  if (priority >= 9) return "Critical";
  if (priority >= 7) return "High";
  if (priority >= 5) return "Medium";
  if (priority >= 3) return "Low";
  return "Minimal";
}

function getPriorityCssClass(priority: number): string {
  if (priority >= 9) return "priority-critical";
  if (priority >= 7) return "priority-high";
  if (priority >= 5) return "priority-medium";
  if (priority >= 3) return "priority-low";
  return "priority-minimal";
}
```

## Raw API Examples

### Direct Notion API Access

```typescript
// Use Raw API when you need complete Notion API compatibility
async function accessRawNotionData() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  console.log("Raw API - Direct Notion API access:");

  posts.slice(0, 2).forEach((post) => {
    console.log(`\nPost: ${post.Title}`);

    // Access raw Notion API properties
    const rawProperties = post.raw.properties;

    console.log("Raw property structure:");
    Object.entries(rawProperties).forEach(([propertyName, propertyValue]) => {
      console.log(`  ${propertyName}:`, {
        id: propertyValue.id,
        type: propertyValue.type,
        hasContent: !!propertyValue[propertyValue.type],
      });
    });

    // Access specific raw property data
    if (rawProperties.Title) {
      const titleProperty = rawProperties.Title;
      console.log("Raw title structure:", {
        id: titleProperty.id,
        type: titleProperty.type,
        richTextArray: titleProperty.title?.length || 0,
        firstItem: titleProperty.title?.[0],
      });
    }

    // Access creation and modification metadata
    console.log("Page metadata:", {
      id: post.raw.id,
      created_time: post.raw.created_time,
      last_edited_time: post.raw.last_edited_time,
      created_by: post.raw.created_by?.id,
      last_edited_by: post.raw.last_edited_by?.id,
      archived: post.raw.archived,
      in_trash: post.raw.in_trash,
    });
  });
}
```

### Custom Property Handling

```typescript
// Use Raw API for custom property types or complex processing
async function handleCustomProperties() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  console.log("Raw API - Custom property handling:");

  posts.slice(0, 3).forEach((post) => {
    console.log(`\nAnalyzing raw properties for: ${post.Title}`);

    const rawProps = post.raw.properties;

    // Handle formula properties (not in Simple API)
    Object.entries(rawProps).forEach(([name, prop]) => {
      if (prop.type === "formula") {
        console.log(`Formula property "${name}":`, {
          type: prop.formula?.type,
          value:
            prop.formula?.string ||
            prop.formula?.number ||
            prop.formula?.boolean,
          expression: "Hidden in Notion API",
        });
      }

      // Handle rollup properties
      if (prop.type === "rollup") {
        console.log(`Rollup property "${name}":`, {
          type: prop.rollup?.type,
          function: prop.rollup?.function,
          arrayLength: prop.rollup?.array?.length || 0,
        });
      }

      // Handle relation properties
      if (prop.type === "relation") {
        console.log(`Relation property "${name}":`, {
          relationCount: prop.relation?.length || 0,
          relatedIds: prop.relation?.map((rel) => rel.id) || [],
        });
      }

      // Handle files with expiration times
      if (prop.type === "files" && prop.files) {
        console.log(`Files property "${name}":`, {
          fileCount: prop.files.length,
          files: prop.files.map((file) => ({
            name: file.name,
            url: file.file?.url || file.external?.url,
            expiryTime: file.file?.expiry_time,
          })),
        });
      }
    });
  });
}
```

### Advanced Database Schema Analysis

```typescript
// Use Raw API for deep database schema analysis
async function analyzeDatabase() {
  // Get database schema information (requires database endpoint)
  try {
    // This would require direct Notion API call for database schema
    console.log("Raw API - Database schema analysis:");

    const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

    if (posts.length === 0) {
      console.log("No posts found");
      return;
    }

    // Analyze schema from raw data
    const samplePost = posts[0];
    const properties = samplePost.raw.properties;

    const schemaAnalysis = Object.entries(properties).map(([name, prop]) => {
      const analysis = {
        name,
        type: prop.type,
        id: prop.id,
        hasValue: !!prop[prop.type],
        valueType: Array.isArray(prop[prop.type])
          ? "array"
          : typeof prop[prop.type],
      };

      // Type-specific analysis
      switch (prop.type) {
        case "select":
          analysis.options = "Use database endpoint to get options";
          break;
        case "multi_select":
          analysis.options = "Use database endpoint to get options";
          break;
        case "relation":
          analysis.relatedDatabase = prop.relation?.[0]
            ? "Has relations"
            : "No relations";
          break;
        case "rollup":
          analysis.rollupFunction = prop.rollup?.function;
          break;
        case "formula":
          analysis.formulaType = prop.formula?.type;
          break;
      }

      return analysis;
    });

    console.log("Database property schema:");
    schemaAnalysis.forEach((prop) => {
      console.log(`  ${prop.name}: ${prop.type} (${prop.id})`);
      if (prop.options) console.log(`    Options: ${prop.options}`);
      if (prop.relatedDatabase)
        console.log(`    Relations: ${prop.relatedDatabase}`);
      if (prop.rollupFunction)
        console.log(`    Rollup function: ${prop.rollupFunction}`);
      if (prop.formulaType)
        console.log(`    Formula type: ${prop.formulaType}`);
    });

    return schemaAnalysis;
  } catch (error) {
    console.error("Schema analysis error:", error.message);
  }
}
```

## Hybrid API Usage

### Combining All Three Layers

```typescript
// Use all three layers together for maximum flexibility
async function hybridApiUsage() {
  const posts = await notionCms.getAllDatabaseRecords(BLOG_DB_ID);

  console.log("Hybrid API Usage - Combining all layers:");

  const enhancedPosts = posts.map((post) => {
    // Simple API for business logic
    const isHighPriority = post.Priority && post.Priority > 8;
    const isRecent =
      post.PublishDate &&
      post.PublishDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const wordCount = (post.Content || "").split(/\s+/).length;

    // Advanced API for rich UI data
    const statusColor = post.advanced?.Status?.color || "gray";
    const authorAvatars = (post.advanced?.Author || [])
      .map((author) => author.avatar_url)
      .filter(Boolean);
    const tagColors = (post.advanced?.Tags || []).map((tag) => ({
      name: tag.name,
      color: tag.color,
    }));

    // Raw API for metadata and special properties
    const createdTime = new Date(post.raw.created_time);
    const lastEditedTime = new Date(post.raw.last_edited_time);
    const daysSinceEdit =
      (Date.now() - lastEditedTime.getTime()) / (1000 * 60 * 60 * 24);

    // Find custom properties from raw data
    const customProperties = Object.entries(post.raw.properties)
      .filter(
        ([, prop]) =>
          ![
            "title",
            "rich_text",
            "select",
            "multi_select",
            "date",
            "number",
            "checkbox",
            "people",
            "url",
            "email",
          ].includes(prop.type)
      )
      .map(([name, prop]) => ({ name, type: prop.type }));

    return {
      // Simple API data
      id: post.id,
      title: post.Title,
      status: post.Status,
      priority: post.Priority || 0,
      publishDate: post.PublishDate,

      // Calculated business logic
      isHighPriority,
      isRecent,
      wordCount,
      readingTime: Math.ceil(wordCount / 200),

      // Advanced API styling
      statusColor,
      authorAvatars,
      tagColors,

      // Raw API metadata
      createdTime,
      lastEditedTime,
      daysSinceEdit: Math.round(daysSinceEdit),
      customProperties,

      // Combined insights
      needsAttention:
        !isRecent && daysSinceEdit > 30 && post.Status === "Draft",
      isFeatureWorthy: isHighPriority && isRecent && wordCount > 500,
      authorInfo: (post.advanced?.Author || []).map((author) => ({
        name: author.name,
        avatar: author.avatar_url,
        email: author.person?.email,
      })),
    };
  });

  // Generate comprehensive report
  const report = {
    total: enhancedPosts.length,
    highPriority: enhancedPosts.filter((p) => p.isHighPriority).length,
    recent: enhancedPosts.filter((p) => p.isRecent).length,
    needsAttention: enhancedPosts.filter((p) => p.needsAttention).length,
    featureWorthy: enhancedPosts.filter((p) => p.isFeatureWorthy).length,
    averageWordCount: Math.round(
      enhancedPosts.reduce((sum, p) => sum + p.wordCount, 0) /
        enhancedPosts.length
    ),
    statusDistribution: enhancedPosts.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    customPropertyTypes: [
      ...new Set(
        enhancedPosts.flatMap((p) => p.customProperties.map((cp) => cp.type))
      ),
    ],
  };

  console.log("Comprehensive Report:");
  console.log(`  Total posts: ${report.total}`);
  console.log(`  High priority: ${report.highPriority}`);
  console.log(`  Recent: ${report.recent}`);
  console.log(`  Needs attention: ${report.needsAttention}`);
  console.log(`  Feature worthy: ${report.featureWorthy}`);
  console.log(`  Average word count: ${report.averageWordCount}`);
  console.log(
    `  Custom property types: ${report.customPropertyTypes.join(", ")}`
  );

  console.log("\nStatus distribution:");
  Object.entries(report.statusDistribution).forEach(([status, count]) => {
    console.log(`    ${status}: ${count}`);
  });

  return enhancedPosts;
}
```

### API Layer Decision Matrix

```typescript
// Helper to decide which API layer to use
class ApiLayerDecision {
  static chooseLayer(useCase: string): string {
    const decisions = {
      // Simple API use cases
      "business-logic": "Simple",
      "data-filtering": "Simple",
      calculations: "Simple",
      "basic-display": "Simple",
      "api-responses": "Simple",

      // Advanced API use cases
      "rich-formatting": "Advanced",
      "ui-components": "Advanced",
      "color-schemes": "Advanced",
      "tag-styling": "Advanced",
      "user-avatars": "Advanced",
      "content-preview": "Advanced",

      // Raw API use cases
      "custom-properties": "Raw",
      "metadata-access": "Raw",
      debugging: "Raw",
      migration: "Raw",
      "complex-analysis": "Raw",
      "direct-api-compat": "Raw",
    };

    return decisions[useCase] || "Simple (default)";
  }

  static getRecommendation(requirements: string[]): string {
    const layers = requirements.map((req) => this.chooseLayer(req));
    const uniqueLayers = [...new Set(layers)];

    if (uniqueLayers.length === 1) {
      return `Use ${uniqueLayers[0]} API exclusively`;
    } else {
      return `Use Hybrid approach: ${uniqueLayers.join(" + ")} APIs`;
    }
  }
}

// Usage examples
console.log("API Layer Recommendations:");
console.log(
  ApiLayerDecision.getRecommendation(["business-logic", "calculations"])
);
console.log(
  ApiLayerDecision.getRecommendation(["ui-components", "color-schemes"])
);
console.log(
  ApiLayerDecision.getRecommendation(["debugging", "metadata-access"])
);
console.log(
  ApiLayerDecision.getRecommendation([
    "business-logic",
    "ui-components",
    "debugging",
  ])
);
```

## Best Practices

### When to Use Each Layer

```typescript
// Best practices for layer selection
const layerBestPractices = {
  simple: {
    use_when: [
      "Building business logic",
      "Performing calculations",
      "Creating API responses",
      "Filtering and sorting data",
      "Basic data display",
    ],
    examples: [
      "if (post.Status === 'Published')",
      "posts.filter(p => p.Priority > 5)",
      "const total = items.reduce((sum, item) => sum + item.Price, 0)",
    ],
  },

  advanced: {
    use_when: [
      "Creating rich UI components",
      "Preserving text formatting",
      "Using property colors/metadata",
      "Building content previews",
      "Generating styled outputs",
    ],
    examples: [
      "const tagHtml = tag.map(t => `<span class='tag-${t.color}'>${t.name}</span>`)",
      "const avatar = author.avatar_url || defaultAvatar",
      "const statusColor = status.color",
    ],
  },

  raw: {
    use_when: [
      "Debugging data issues",
      "Handling custom property types",
      "Accessing page metadata",
      "Building migration tools",
      "Working with formula/rollup properties",
    ],
    examples: [
      "console.log('Raw structure:', record.raw)",
      "const createdBy = record.raw.created_by.id",
      "const formulaResult = property.formula.number",
    ],
  },
};

console.log("Layer Usage Guidelines:");
Object.entries(layerBestPractices).forEach(([layer, guide]) => {
  console.log(`\n${layer.toUpperCase()} API:`);
  console.log("  Use when:");
  guide.use_when.forEach((use) => console.log(`    - ${use}`));
  console.log("  Examples:");
  guide.examples.forEach((example) => console.log(`    - ${example}`));
});
```

## Running the Examples

Execute these layered API examples:

```typescript
async function runLayeredApiExamples() {
  console.log("Layered API Examples");
  console.log("===================");

  // Simple API examples
  console.log("\n1. Simple API Examples:");
  await simpleDataOperations();
  await implementBusinessLogic();

  // Advanced API examples
  console.log("\n2. Advanced API Examples:");
  await handleRichTextFormatting();
  await handlePropertyMetadata();
  await generateUIComponents();

  // Raw API examples
  console.log("\n3. Raw API Examples:");
  await accessRawNotionData();
  await handleCustomProperties();
  await analyzeDatabase();

  // Hybrid usage
  console.log("\n4. Hybrid API Usage:");
  await hybridApiUsage();
}

// Run all examples
runLayeredApiExamples().catch(console.error);
```

## Next Steps

- **[Real-World Use Cases](./real-world-use-cases.md)** - Complete application implementations
- **[Working with Properties](../guides/working-with-properties.md)** - Detailed property handling guide
- **[Core Concepts](../core-concepts.md)** - Understanding the layered architecture
