import { NotionCMS, DatabaseRecord } from "../src";

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
  const publishedFilter = notionCMS.createFilter("isPublished", "equals", true);
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
}

main().catch((error) => {
  console.error("Error:", error);
});
