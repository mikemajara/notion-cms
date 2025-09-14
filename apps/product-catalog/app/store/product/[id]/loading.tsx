export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-6 bg-muted animate-pulse rounded w-96 mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-muted animate-pulse rounded"
              />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 bg-muted animate-pulse rounded w-16"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>

      {/* Recommendations Skeleton */}
      <section className="border-t pt-12">
        <div className="h-7 bg-muted animate-pulse rounded w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-muted animate-pulse rounded-lg" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
