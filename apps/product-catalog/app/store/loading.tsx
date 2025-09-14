import { ProductGridSkeleton } from "@/components/store/product-grid-skeleton"

export default function StoreLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-9 bg-muted animate-pulse rounded w-48 mb-2" />
        <div className="h-5 bg-muted animate-pulse rounded w-72" />
      </div>

      <div className="mb-6">
        <div className="h-10 bg-muted animate-pulse rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </aside>

        <main className="lg:col-span-3">
          <ProductGridSkeleton />
        </main>
      </div>
    </div>
  )
}
