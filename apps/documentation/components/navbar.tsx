"use client";

import cn from "clsx";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { RecordNotionCMS } from "@/notion";
import Image from "next/image";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Circle,
  CircleDot,
  CircleDotIcon,
  MenuIcon,
  Square,
} from "lucide-react";

function Item(props: React.ComponentProps<typeof Link>) {
  const pathname = usePathname();
  const href = props.href;

  if (typeof href !== "string") {
    throw new Error("`href` must be a string");
  }

  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <li>
      <Link
        {...props}
        className={cn(isActive ? "font-bold" : "font-light", props.className)}
        draggable={false}
      />
    </li>
  );
}

const Content = ({ pages }: { pages: RecordNotionCMS[] }) => {
  return (
    <>
      <div className="flex items-end justify-end gap-2 px-2 py-4">
        <Image src="/logo.svg" alt="logo" width={100} height={100} />
      </div>
      <ul className="flex flex-col gap-1 mb-6 text-right lowercase hover:font-regular">
        {pages.map((page) => (
          <Item
            key={page.id}
            href={`/docs/${page.slug}`}
            className="block w-full px-3 py-1 text-right transition-colors"
          >
            {page.Name}
          </Item>
        ))}
      </ul>
    </>
  );
};

export default function Navbar({ pages }: { pages: RecordNotionCMS[] }) {
  return (
    <nav className="relative w-auto mr-4 max-w-[150px]">
      <div className="block sm:hidden absolute top-2 left-2 z-1">
        <Sheet>
          <SheetTrigger className="hover:cursor-pointer">
            <Square className="w-4 h-4 text-primary" />
          </SheetTrigger>
          <SheetTitle hidden>Menu</SheetTitle>
          <SheetDescription hidden>Menu</SheetDescription>
          <SheetContent side="left">
            <Content pages={pages} />
            <SheetClose />
          </SheetContent>
        </Sheet>
      </div>
      <div className="hidden top-10 sticky sm:block">
        <Content pages={pages} />
      </div>
    </nav>
  );
}
