import { ProductGrid } from "@/components/product-grid"
import { StrategyIndicator } from "@/components/strategy-indicator"
import { NotionCMS } from "@mikemajara/notion-cms"
// Import to ensure prototype extensions are executed
import "@/notion/notion-types-art-gallery-inventory"

export default async function Home() {
  const cms = new NotionCMS(process.env.NOTION_API_KEY!, {
    files: {
      strategy: "local"
    }
  })
  const artworks = await cms
    .query("artGalleryInventory")
    .filter("Published", "equals", true)
    .sort("Date Acquired", "descending")
    .all()

  return (
    <div className="container px-4 py-8 mx-auto">
      <StrategyIndicator />
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Art Gallery Shop</h1>
        <p className="text-lg text-muted-foreground">
          Discover unique artworks from talented artists
        </p>
      </div>

      <ProductGrid artworks={artworks} strategy="direct" className="mb-12" />
    </div>
  )
}
