import { ProductGrid } from "@/components/product-grid";
import { StrategyIndicator } from "@/components/strategy-indicator";
import { NotionCMS } from "@mikemajara/notion-cms";
// Import to ensure prototype extensions are executed
import "@/notion/notion-types-art-gallery-inventory";

export default async function Home() {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
    files: {
      strategy: "remote",
      storage: {
        endpoint: process.env.AWS_ENDPOINT_URL_S3!,
        bucket: process.env.AWS_BUCKET!,
        accessKey: process.env.AWS_ACCESS_KEY_ID!,
        secretKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    },
  });
  const artworks = await notionCMS
    .query("artGalleryInventory")
    .filter("Published", "equals", true)
    .sort("Date Acquired", "descending")
    .all();

  return (
    <div className="container mx-auto px-4 py-8">
      <StrategyIndicator />
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Art Gallery Shop</h1>
        <p className="text-muted-foreground text-lg">
          Discover unique artworks from talented artists
        </p>
      </div>

      <ProductGrid
        artworks={artworks}
        strategy="cache-remote"
        className="mb-12"
      />
    </div>
  );
}
