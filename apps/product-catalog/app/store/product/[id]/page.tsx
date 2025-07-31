import { Suspense } from "react";
import { ProductImages } from "@/components/store/product-images";
import { ProductInfo } from "@/components/store/product-info";
import { ProductActions } from "@/components/store/product-actions";
import { ProductRecommendations } from "@/components/store/product-recommendations";
import { ProductBreadcrumb } from "@/components/store/product-breadcrumb";
import { fetchProductAction } from "@/actions/products";
import { RecordProductCatalog } from "@/notion/notion-types-product-catalog";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product: RecordProductCatalog = (await fetchProductAction({
    id,
  })) as RecordProductCatalog;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="h-6 bg-muted animate-pulse rounded w-96 mb-6" />
        }
      >
        <ProductBreadcrumb productId={product.Name} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          <Suspense
            fallback={
              <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            }
          >
            <ProductImages productId={id} />
          </Suspense>
        </div>

        {/* Product Info & Actions */}
        <div className="space-y-6">
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-20 bg-muted animate-pulse rounded" />
                <div className="h-12 bg-muted animate-pulse rounded" />
              </div>
            }
          >
            <ProductInfo product={product} />
          </Suspense>

          <Suspense
            fallback={
              <div className="space-y-3">
                <div className="h-12 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            }
          >
            <ProductActions productId={id} />
          </Suspense>
        </div>
      </div>

      {/* Recommendations */}
      <section className="border-t pt-12">
        <h2 className="text-2xl font-bold mb-6">You might also like</h2>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square bg-muted animate-pulse rounded-lg" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          }
        >
          <ProductRecommendations productId={id} />
        </Suspense>
      </section>
    </div>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;

  // This would typically fetch product data for metadata
  // For now, return generic metadata
  return {
    title: "Product Details - Store",
    description: "View detailed information about this product",
  };
}
