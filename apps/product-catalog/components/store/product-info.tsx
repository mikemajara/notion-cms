import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, Truck, Shield, RotateCcw } from "lucide-react"
import { RecordProductCatalog } from "@/notion/notion-types-product-catalog"

export function ProductInfo({ product }: RecordProductCatalog) {
  return (
    <div className="space-y-6">
      {/* Product Title & Price */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {product.Name}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-primary">
            ${product.Price.toFixed(2)}
          </span>
          {product["In Stock"] ? (
            <Badge
              variant="outline"
              className="text-green-600 border-green-600"
            >
              In Stock
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-600">
              Out of Stock
            </Badge>
          )}
        </div>
      </div>

      {/* Rating & Reviews */}
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < 4
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          (4.2 out of 5 stars)
        </span>
        <span className="text-sm text-muted-foreground">•</span>
        <span className="text-sm text-muted-foreground">127 reviews</span>
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-2">
        <h3 className="font-semibold">Description</h3>
        <p className="text-muted-foreground leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <h3 className="font-semibold">Features</h3>
        <div className="flex flex-wrap gap-2">
          {product.Tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Product Details */}
      <div className="space-y-2">
        <h3 className="font-semibold">Product Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">SKU:</span>
            <span className="ml-2 font-medium">{product.SKU}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Category:</span>
            <span className="ml-2 font-medium">{product.Category}</span>
          </div>
        </div>
      </div>

      {/* Shipping & Policies */}
      <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-3 text-sm">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span>Free shipping on orders over $50</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
          <span>30-day return policy</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span>2-year warranty included</span>
        </div>
      </div>
    </div>
  )
}
