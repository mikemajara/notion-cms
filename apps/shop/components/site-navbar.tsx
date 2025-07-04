import Link from "next/link";
import { Store, Home, LayoutDashboard, Globe } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
// import { ThemeSelector } from "./theme-selector";
// import { ModeToggle } from "./mode-toggle";

// Menu items - reusing the same items from the sidebar
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Direct",
    url: "/direct",
    icon: LayoutDashboard,
  },
  {
    title: "Local",
    url: "/cache/local",
    icon: Store,
  },
  {
    title: "Remote",
    url: "/cache/remote",
    icon: Globe,
  },
  // {
  //   title: "Blog",
  //   url: "/blog",
  //   icon: BookOpen,
  // },
  // {
  //   title: "Query url",
  //   url: "/query-url",
  //   icon: LinkIcon,
  // },
  // {
  //   title: "Settings",
  //   url: "#",
  //   icon: Settings,
  // },
];

export function SiteNavbar() {
  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-10 flex h-14 justify-between items-center">
        <NavigationMenu>
          <NavigationMenuList>
            {items.map((item) => (
              <NavigationMenuItem key={item.title}>
                <Link href={item.url} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center gap-2">
          {/* <ThemeSelector /> */}
          {/* <ModeToggle /> */}
        </div>
      </div>
    </div>
  );
}
