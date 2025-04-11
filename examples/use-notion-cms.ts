import { NotionCMS, DatabaseRecord, SimpleBlock } from "../src";

// Extend the DatabaseRecord with your specific database structure
interface BlogPost extends DatabaseRecord {
  title: string;
  slug: string;
  content: string;
  publishedAt: Date;
  tags: string[];
  isPublished: boolean;
}

async function main() {
  // Initialize the NotionCMS client with your token
  const notionCMS = new NotionCMS("your-notion-api-token");

  // Database ID from your Notion database
  const databaseId = "your-database-id";

  // Example 1: Get all published blog posts
  const publishedFilter = {
    property: "isPublished",
    checkbox: {
      equals: true,
    },
  };

  const publishedPosts = await notionCMS.getAllDatabaseRecords<BlogPost>(
    databaseId,
    {
      filter: publishedFilter,
      sorts: [{ property: "publishedAt", direction: "descending" }],
    }
  );

  console.log(`Found ${publishedPosts.length} published posts`);

  // Example 2: Get a specific post by ID
  if (publishedPosts.length > 0) {
    const postId = publishedPosts[0].id;
    const singlePost = await notionCMS.getRecord<BlogPost>(postId);
    console.log("First post details:", {
      title: singlePost.title,
      publishedAt: singlePost.publishedAt,
      tags: singlePost.tags,
    });

    // Example 5 (NEW): Get page content (blocks)
    console.log("Fetching content for post:", singlePost.title);

    // Get the content blocks for the page
    const blocks = await notionCMS.getPageContent(postId, true); // true = fetch recursively
    console.log(`Retrieved ${blocks.length} top-level blocks`);

    // Example 6 (NEW): Convert blocks to Markdown
    const markdown = notionCMS.blocksToMarkdown(blocks);
    console.log("Markdown content preview:");
    console.log(markdown.substring(0, 300) + "...");

    // Example 7 (NEW): Convert blocks to HTML
    const html = notionCMS.blocksToHtml(blocks);
    console.log("HTML content preview:");
    console.log(html.substring(0, 300) + "...");

    // Save the content to files
    const fs = require("fs");
    fs.writeFileSync(`${singlePost.slug}.md`, markdown);
    fs.writeFileSync(`${singlePost.slug}.html`, html);
    console.log(
      `Content saved to ${singlePost.slug}.md and ${singlePost.slug}.html`
    );
  }

  // Example 3: Paginate through results
  const paginationDemo = async () => {
    let hasMore = true;
    let cursor: string | null = null;
    let page = 1;

    while (hasMore) {
      const response = await notionCMS.getDatabase<BlogPost>(databaseId, {
        pageSize: 10,
        startCursor: cursor || undefined,
      });

      console.log(`Page ${page}: ${response.results.length} records`);

      // Process the current page results
      response.results.forEach((post) => {
        console.log(`- ${post.title} (${post.publishedAt})`);
      });

      hasMore = response.hasMore;
      cursor = response.nextCursor;
      page++;

      // Avoid infinite loops in case of an issue
      if (page > 10) break;
    }
  };

  await paginationDemo();

  // Example 4: Filter by multiple criteria
  const recentTaggedPosts = await notionCMS.getAllDatabaseRecords<BlogPost>(
    databaseId,
    {
      filter: {
        and: [
          {
            property: "tags",
            multi_select: {
              contains: "tutorial",
            },
          },
          {
            property: "publishedAt",
            date: {
              after: new Date("2023-01-01").toISOString(),
            },
          },
        ],
      },
    }
  );

  console.log(
    `Found ${recentTaggedPosts.length} tutorial posts from 2023 onwards`
  );

  // Example 8 (NEW): Working with specific block types
  if (publishedPosts.length > 0) {
    const postId = publishedPosts[0].id;
    const blocks = await notionCMS.getPageContent(postId);

    // Find all images
    const images = blocks.filter((block) => block.type === "image");
    console.log(`Found ${images.length} images in the post`);

    // Extract all headings to create a table of contents
    const headings = blocks.filter((block) =>
      ["heading_1", "heading_2", "heading_3"].includes(block.type)
    );

    if (headings.length > 0) {
      console.log("Table of Contents:");
      headings.forEach((heading) => {
        const level = parseInt(heading.type.split("_")[1]);
        const indent = "  ".repeat(level - 1);
        console.log(`${indent}- ${heading.content.text}`);
      });
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
});
