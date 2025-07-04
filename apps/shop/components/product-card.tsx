import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RecordArtGalleryInventory } from "@/notion/notion-types-art-gallery-inventory";
import { generateProductLink, type FileStrategy } from "@/lib/strategy-utils";

interface ProductCardProps {
  artwork: RecordArtGalleryInventory;
  strategy: FileStrategy;
  className?: string;
}

export function ProductCard({
  artwork,
  strategy,
  className,
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getStatusVariant = (status: any) => {
    if (!status) return "secondary";

    const statusName = typeof status === "string" ? status : status.name;

    switch (statusName?.toLowerCase()) {
      case "available":
      case "for sale":
        return "default";
      case "sold":
        return "destructive";
      case "reserved":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getMediumColor = (medium: string) => {
    const colors = {
      "Oil Paint":
        "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
      Acrylic:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      Watercolor:
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400",
      Sculpture:
        "bg-stone-100 text-stone-800 dark:bg-stone-900/20 dark:text-stone-400",
      "Mixed Media":
        "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      Digital:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Charcoal/Graphite":
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      Photography:
        "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
      Textile:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    };
    return (
      colors[medium as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    );
  };

  return (
    <Link href={generateProductLink(artwork.id, strategy)} className="group">
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden">
          {artwork.Image.length > 0 ? (
            <Image
              src={artwork.Image?.[0]?.url}
              alt={artwork["Artwork Title"] || "Artwork"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}

          {/* Status Badge Overlay */}
          {artwork.Status && (
            <div className="absolute top-3 right-3">
              <Badge variant={getStatusVariant(artwork.Status)}>
                {typeof artwork.Status === "string"
                  ? artwork.Status
                  : artwork.Status.name}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                {artwork["Artwork Title"] || "Untitled"}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {artwork.Artist || "Unknown Artist"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {artwork.Medium && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", getMediumColor(artwork.Medium))}
                >
                  {artwork.Medium}
                </Badge>
              )}
            </div>

            {artwork.Dimensions && (
              <p className="text-xs text-muted-foreground">
                {artwork.Dimensions}
              </p>
            )}

            {artwork.Description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {artwork.Description}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="font-bold text-lg">
            {artwork.Price ? formatPrice(artwork.Price) : "Price on Request"}
          </div>

          {artwork["Commission Rate"] && artwork["Commission Rate"] > 0 && (
            <Badge variant="secondary" className="text-xs">
              {artwork["Commission Rate"]}% commission
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
