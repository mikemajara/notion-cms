import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface CategoryBreadcrumbProps {
  category: string
}

export function CategoryBreadcrumb({ category }: CategoryBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link href="/store" className="hover:text-foreground transition-colors">
        Store
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground">{category}</span>
    </nav>
  )
}
