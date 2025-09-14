"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

export function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("search") || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)

    if (query.trim()) {
      params.set("search", query.trim())
    } else {
      params.delete("search")
    }

    router.push(`/store?${params.toString()}`)
  }

  const clearSearch = () => {
    setQuery("")
    const params = new URLSearchParams(searchParams)
    params.delete("search")
    router.push(`/store?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
        >
          Search
        </Button>
      </div>
    </form>
  )
}
