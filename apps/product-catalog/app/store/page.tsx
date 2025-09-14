import { Suspense } from "react"
import { ProductGrid } from "@/components/store/product-grid"
import { ProductFilters } from "@/components/store/product-filters"
import { ProductSearch } from "@/components/store/product-search"
import { ProductGridSkeleton } from "@/components/store/product-grid-skeleton"

export default function StorePage({
  searchParams
}: {
  searchParams: Promise<{ category: string; searchQuery: string }>
}) {
  return (
    <div className="container mx-auto px-4 ">
      <div className="mb-6">
        <Suspense
          fallback={<div className="h-10 bg-muted animate-pulse rounded" />}
        >
          <ProductSearch />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <Suspense
            fallback={
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
            }
          >
            <ProductFilters />
          </Suspense>
        </aside>

        <main className="lg:col-span-3">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export const metadata = {
  title: "Product Catalog - Store",
  description:
    "Browse our complete product catalog with advanced filtering and search"
}
