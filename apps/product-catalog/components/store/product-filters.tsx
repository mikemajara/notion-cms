"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface ProductFiltersProps {
  selectedCategory?: string
}

const categories = [
  { value: "Electronics", label: "Electronics" },
  { value: "Clothing", label: "Clothing" },
  { value: "Home & Kitchen", label: "Home & Kitchen" },
  { value: "Accessories", label: "Accessories" },
  { value: "Sports & Fitness", label: "Sports & Fitness" },
  { value: "Home & Garden", label: "Home & Garden" },
  { value: "Home & Office", label: "Home & Office" },
  { value: "Health & Nutrition", label: "Health & Nutrition" },
  { value: "Home & Wellness", label: "Home & Wellness" },
  { value: "Office Supplies", label: "Office Supplies" }
]

const priceRanges = [
  { value: "0-25", label: "Under $25" },
  { value: "25-50", label: "$25 - $50" },
  { value: "50-100", label: "$50 - $100" },
  { value: "100-200", label: "$100 - $200" },
  { value: "200+", label: "Over $200" }
]

const availabilityOptions = [
  { value: "In Stock", label: "In Stock" },
  { value: "Out of Stock", label: "Out of Stock" }
]

export function ProductFilters({ selectedCategory }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)

    if (params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    router.push(`/store?${params.toString()}`, { scroll: false })
  }

  const clearAllFilters = () => {
    router.push("/store")
  }

  const activeFilters = Array.from(searchParams.entries()).filter(
    ([key]) => key !== "search"
  )

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Filters</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(([key, value]) => (
                <Badge
                  key={`${key}-${value}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {value}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter(key, value)}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      {!selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => updateFilter("category", category.value)}
                  className={`w-full text-left text-sm py-1 px-2 rounded hover:bg-muted transition-colors ${
                    searchParams.get("category") === category.value
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => updateFilter("price", range.value)}
                className={`w-full text-left text-sm py-1 px-2 rounded hover:bg-muted transition-colors ${
                  searchParams.get("price") === range.value
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {availabilityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter("availability", option.value)}
                className={`w-full text-left text-sm py-1 px-2 rounded hover:bg-muted transition-colors ${
                  searchParams.get("availability") === option.value
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
