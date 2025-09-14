import { NotionCMS } from "@mikemajara/notion-cms"
import "@/notion/notion-types-product-catalog"
import { RecordProductCatalogFieldTypes } from "@/notion/notion-types-product-catalog"

type FetchProductsActionProps = {
  category?: (typeof RecordProductCatalogFieldTypes.Category.options)[number]
  priceRange?: {
    from: number
    to: number
  }
  availability?: boolean
  searchQuery?: string
}

export const fetchProductsAction = async ({
  category,
  priceRange,
  availability,
  searchQuery
}: FetchProductsActionProps = {}) => {
  const cms = new NotionCMS(process.env.NOTION_API_KEY!, {
    files: {
      strategy: "local"
    },
    debug: { enabled: true }
  })
  let result = cms.query("productCatalog")

  if (category) result = result.filter("Category", "equals", category)
  if (priceRange)
    result = result
      .filter("Price", "greater_than_or_equal_to", priceRange.from)
      .filter("Price", "less_than_or_equal_to", priceRange.to)
  if (availability) result = result.filter("In Stock", "equals", availability)
  if (searchQuery) result = result.filter("Name", "contains", searchQuery)

  const products = await result.all()

  console.log(`fetchProductsAction: ${products}`)

  return products
}

export const fetchProductAction = async ({ id }: { id: string }) => {
  const cms = new NotionCMS(process.env.NOTION_API_KEY!, {
    debug: { enabled: true }
  })
  const product = cms.getRecord(id)
  return product
}
