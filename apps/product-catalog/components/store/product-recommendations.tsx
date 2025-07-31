import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductRecommendationsProps {
  productId: string;
}

// Mock recommendations data - will be replaced with actual Notion CMS data
const mockRecommendations = [
  {
    id: '2',
    Name: 'Wireless Mouse',
    Price: 29.99,
    Image: [{ url: '/placeholder.svg', name: 'mouse.jpg' }],
    Tags: ['Wireless', 'Ergonomic'],
    'In Stock': true,
  },
  {
    id: '3',
    Name: 'USB-C Cable',
    Price: 19.99,
    Image: [{ url: '/placeholder.svg', name: 'cable.jpg' }],
    Tags: ['Fast-Charging', 'Durable'],
    'In Stock': true,
  },
  {
    id: '4',
    Name: 'Phone Stand',
    Price: 15.99,
    Image: [{ url: '/placeholder.svg', name: 'stand.jpg' }],
    Tags: ['Adjustable', 'Portable'],
    'In Stock': false,
  },
  {
    id: '5',
    Name: 'Bluetooth Speaker',
    Price: 79.99,
    Image: [{ url: '/placeholder.svg', name: 'speaker.jpg' }],
    Tags: ['Audio', 'Portable', 'Waterproof'],
    'In Stock': true,
  },
];

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {mockRecommendations.map((product) => (
        <Card key={product.id} className="group overflow-hidden">
          <div className="relative aspect-square overflow-hidden">
            <Link href={`/store/product/${product.id}`}>
              <Image
                src={product.Image[0]?.url || '/placeholder.svg'}
                alt={product.Name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </Link>
            
            {!product['In Stock'] && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary">Out of Stock</Badge>
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <Link href={`/store/product/${product.id}`}>
              <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {product.Name}
              </h4>
            </Link>
            
            <div className="flex flex-wrap gap-1 mt-2 mb-3">
              {product.Tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold">
                ${product.Price.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}