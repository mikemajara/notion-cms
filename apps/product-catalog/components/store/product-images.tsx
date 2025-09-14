"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ZoomIn } from "lucide-react"

interface ProductImagesProps {
  productId: string
}

// Mock image data - will be replaced with actual Notion CMS data
const mockImages = [
  { url: "/placeholder.svg", name: "main-image.jpg" },
  { url: "/placeholder.svg", name: "side-view.jpg" },
  { url: "/placeholder.svg", name: "detail-view.jpg" },
  { url: "/placeholder.svg", name: "packaging.jpg" }
]

export function ProductImages({ productId }: ProductImagesProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
        <Image
          src={mockImages[selectedImageIndex]?.url || "/placeholder.svg"}
          alt={`Product image ${selectedImageIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnail Gallery */}
      {mockImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {mockImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square bg-muted rounded overflow-hidden border-2 transition-colors ${
                selectedImageIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground"
              }`}
            >
              <Image
                src={image.url}
                alt={`Product thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
