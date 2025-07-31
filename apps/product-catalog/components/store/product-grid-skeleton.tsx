export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-square bg-muted animate-pulse rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}