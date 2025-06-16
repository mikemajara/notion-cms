"use client";

import cn from "clsx";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { RecordNotionCMS } from "@/notion";
import Image from "next/image";

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

export default function Navbar({ pages }: { pages: RecordNotionCMS[] }) {
  return (
    <nav className="relative w-auto mr-4">
      <div className="sticky top-10">
        <div className="flex items-end justify-end gap-2 px-2 pb-4">
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
      </div>
    </nav>
  );
}
