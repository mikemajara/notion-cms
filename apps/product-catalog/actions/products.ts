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
  searchQuery,
}: FetchProductsActionProps = {}) => {
  const cms = new NotionCMS(process.env.NOTION_API_KEY!, {
    debug: { enabled: true },
  })
  let products = cms.queryProductCatalog(process.env.NOTION_CMS_DATABASE_ID!)

  if (category) products = products.filter("Category", "equals", category)
  if (priceRange)
    products = products
      .filter("Price", "greater_than_or_equal_to", priceRange.from)
      .filter("Price", "less_than_or_equal_to", priceRange.to)
  if (availability)
    products = products.filter("In Stock", "equals", availability)
  if (searchQuery) products = products.filter("Name", "contains", searchQuery)

  console.log(`fetchProductsAction: ${products.all()}`)

  return products
}

export const fetchProductAction = async ({ id }: { id: string }) => {
  const cms = new NotionCMS(process.env.NOTION_API_KEY!, {
    debug: { enabled: true },
  })
  const product = cms.getRecord(id)
  return product
}
