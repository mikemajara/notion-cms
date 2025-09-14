"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Heart, Share2, Minus, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProductActionsProps {
  productId: string
}

export function ProductActions({ productId }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { toast } = useToast()

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, Math.min(10, quantity + change))
    setQuantity(newQuantity)
  }

  const handleAddToCart = () => {
    toast({
      title: "Added to cart",
      description: `${quantity} item(s) added to your cart`
    })
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: isWishlisted
        ? "Item removed from your wishlist"
        : "Item added to your wishlist"
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this product",
          url: window.location.href
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "Product link copied to clipboard"
        })
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard"
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
              )
            }
            className="w-20 text-center"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleWishlist}
            className={isWishlisted ? "text-red-600 border-red-600" : ""}
          >
            <Heart
              className={`h-4 w-4 mr-2 ${isWishlisted ? "fill-current" : ""}`}
            />
            {isWishlisted ? "Wishlisted" : "Wishlist"}
          </Button>

          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Buy Now Button */}
      <Button size="lg" variant="secondary" className="w-full">
        Buy Now
      </Button>
    </div>
  )
}
