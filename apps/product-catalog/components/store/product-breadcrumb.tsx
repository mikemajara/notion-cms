import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ProductBreadcrumbProps {
  productId: string;
}

export function ProductBreadcrumb({ productId }: ProductBreadcrumbProps) {
  // In a real implementation, you'd fetch the product data to get the actual name and category
  // For now, we'll use placeholder values
  const productName = "Product Name"; // This would come from Notion CMS
  const category = "Electronics"; // This would come from Notion CMS

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link href="/store" className="hover:text-foreground transition-colors">
        Store
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link 
        href={`/store/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
        className="hover:text-foreground transition-colors"
      >
        {category}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground line-clamp-1">{productName}</span>
    </nav>
  );
}