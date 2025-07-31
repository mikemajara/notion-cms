import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart } from "lucide-react"
import { fetchProductsAction } from "@/actions/products"
import {
  RecordProductCatalog,
  RecordProductCatalogFieldTypes,
} from "@/notion/notion-types-product-catalog"

export async function ProductGrid({
  searchParams,
}: {
  searchParams: Promise<{
    category: (typeof RecordProductCatalogFieldTypes.Category.options)[number]
    searchQuery: string
    availability: string
  }>
}) {
  let filteredProducts: RecordProductCatalog[] = [] //fetchProductsAction();
  const params = await searchParams
  const category = params.category
  const searchQuery = params.searchQuery

  console.log(`searchParams: ${category}, ${searchQuery}`)

  filteredProducts = (await fetchProductsAction({
    category,
    availability:
      params.availability === "In Stock"
        ? true
        : params.availability === "Out of Stock"
        ? false
        : undefined,
    searchQuery: searchQuery,
  })) as RecordProductCatalog[]

  return (
    <div className="space-y-6">
      <span>Category: {category}</span>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} product
          {filteredProducts.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group overflow-hidden">
            <div className="relative aspect-square overflow-hidden">
              <Link href={`/store/product/${product.id}`}>
                <Image
                  src={product.Image[0]?.url || "/placeholder.svg"}
                  alt={product.Name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </Link>

              <div className="absolute top-2 right-2 space-y-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white/80 hover:bg-white"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              {!product["In Stock"] && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="secondary">Out of Stock</Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <Link href={`/store/product/${product.id}`}>
                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {product.Name}
                </h3>
              </Link>

              <div className="flex flex-wrap gap-1 mt-2 mb-3">
                {product.Tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {product.Tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{product.Tags.length - 2} more
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  ${product.Price.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  disabled={!product["In Stock"]}
                  className="shrink-0"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No products found matching your criteria.
          </p>
        </div>
      )}
    </div>
  )
}
