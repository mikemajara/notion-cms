import React from "react";
import { ProductCard } from "./product-card";
import { RecordArtGalleryInventory } from "@/notion/notion-types-art-gallery-inventory";
import { cn } from "@/lib/utils";
import { type FileStrategy } from "@/lib/strategy-utils";

interface ProductGridProps {
  artworks: RecordArtGalleryInventory[];
  strategy: FileStrategy;
  className?: string;
  loading?: boolean;
  emptyState?: React.ReactNode;
}

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

function ProductGridSkeleton({
  count = 6,
  className,
}: ProductGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-square bg-muted rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({
  artworks,
  strategy,
  className,
  loading = false,
  emptyState,
}: ProductGridProps) {
  if (loading) {
    return <ProductGridSkeleton className={className} />;
  }

  if (artworks.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12",
          className
        )}
      >
        {emptyState || (
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-muted-foreground/50 mb-4">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v11a3 3 0 01-3 3H6a3 3 0 01-3-3V7H2a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h6V3H9zm0 5v9h6V8H9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Artworks Found</h3>
            <p className="text-muted-foreground">
              We couldn&apos;t find any artworks matching your criteria.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        className
      )}
    >
      {artworks.map((artwork) => (
        <ProductCard
          key={artwork.id}
          artwork={artwork}
          strategy={strategy}
          className="w-full"
        />
      ))}
    </div>
  );
}

// Additional utility components for different grid layouts
export function ProductGridCompact({
  artworks,
  strategy,
  className,
  loading = false,
}: Omit<ProductGridProps, "emptyState">) {
  if (loading) {
    return (
      <ProductGridSkeleton
        count={8}
        className={cn(
          "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
        className
      )}
    >
      {artworks.map((artwork) => (
        <ProductCard
          key={artwork.id}
          artwork={artwork}
          strategy={strategy}
          className="w-full"
        />
      ))}
    </div>
  );
}

export function ProductGridFeatured({
  artworks,
  strategy,
  className,
  loading = false,
}: Omit<ProductGridProps, "emptyState">) {
  if (loading) {
    return (
      <ProductGridSkeleton
        count={3}
        className={cn(
          "grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {artworks.map((artwork) => (
        <ProductCard
          key={artwork.id}
          artwork={artwork}
          strategy={strategy}
          className="w-full"
        />
      ))}
    </div>
  );
}
