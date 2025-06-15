import { NotionCMS } from "@mikemajara/notion-cms";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RecordNoCMS } from "@/notion";
import { unstable_cache } from "next/cache";
// Import the generated file to register the queryNoCMS method
import "@/notion/notion-types-nocms";

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;

// Cache the page data with tag-based revalidation
const getPageData = (slug: string) =>
  unstable_cache(
    async () => {
      const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!);
      const page = (await notionCMS
        .queryNoCMS(process.env.NOTION_CMS_DATABASE_ID!)
        .filter("slug", "equals", slug)
        .single()) as RecordNoCMS;

      // Fetch page content
      let content = "";
      let hasContent = false;

      try {
        const blocks = await notionCMS.getPageContent(page!.id, true);
        content = notionCMS.blocksToMarkdown(blocks, {
          includeImageUrls: true,
        });
        hasContent = blocks.length > 0 && content.trim().length > 0;
      } catch (contentError) {
        console.warn("Could not fetch page content:", contentError);
        // Don't fail the whole request if content fetching fails
      }

      return { page, content, hasContent };
    },
    [`docs-page-${slug}`],
    {
      tags: [`docs-${slug}`],
      revalidate: 3600,
    }
  );

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { content } = await getPageData(slug)();

  return (
    <div className="container max-w-4xl py-8 mx-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
