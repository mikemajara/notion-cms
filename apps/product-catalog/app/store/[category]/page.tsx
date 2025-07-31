import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/store/product-grid';
import { ProductFilters } from '@/components/store/product-filters';
import { ProductSearch } from '@/components/store/product-search';
import { ProductGridSkeleton } from '@/components/store/product-grid-skeleton';
import { CategoryBreadcrumb } from '@/components/store/category-breadcrumb';

const VALID_CATEGORIES = [
  'electronics', 'clothing', 'home-kitchen', 'accessories', 
  'sports-fitness', 'home-garden', 'home-office', 'health-nutrition',
  'home-wellness', 'office-supplies'
] as const;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  
  if (!VALID_CATEGORIES.includes(category as any)) {
    notFound();
  }

  const categoryName = category.replace('-', ' & ').split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryBreadcrumb category={categoryName} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{categoryName}</h1>
        <p className="text-muted-foreground mt-2">
          Explore our {categoryName.toLowerCase()} collection
        </p>
      </div>

      <div className="mb-6">
        <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded" />}>
          <ProductSearch />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <Suspense fallback={<div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>}>
            <ProductFilters selectedCategory={category} />
          </Suspense>
        </aside>

        <main className="lg:col-span-3">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid category={category} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({
    category,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;
  const categoryName = category.replace('-', ' & ').split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${categoryName} - Product Catalog`,
    description: `Browse our ${categoryName.toLowerCase()} collection with the latest products`,
  };
}