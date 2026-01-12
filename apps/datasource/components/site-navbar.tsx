import Link from "next/link"
import { Home } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ThemeSelector } from "./theme-selector"
import { ModeToggle } from "./mode-toggle"

// Menu items - reusing the same items from the sidebar
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
]

export function SiteNavbar() {
  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-between items-center px-10 h-14">
        <NavigationMenu>
          <NavigationMenuList>
            {items.map((item) => (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href={item.url} passHref>
                    <span className="flex gap-2 items-center">
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex gap-2 items-center">
          <ThemeSelector />
          <ModeToggle />
        </div>
      </div>
    </div>
  )
}
