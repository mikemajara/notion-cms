"use client";

import cn from "clsx";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { RecordNoCMS } from "@/notion";

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
        className={cn(
          "block w-full px-3 py-1 text-right transition-colors",
          isActive
            ? "text-rurikon-800"
            : "text-rurikon-300 hover:text-rurikon-600"
        )}
        draggable={false}
      />
    </li>
  );
}

export default function Navbar({ pages }: { pages: RecordNoCMS[] }) {
  return (
    <nav className="w-auto mr-4">
      <ul className="sticky flex flex-col gap-1 mb-6 text-right lowercase top-6 sm:top-10 md:top-14">
        {pages.map((page) => (
          <Item key={page.id} href={`/docs/${page.slug}`}>
            {page.Name}
          </Item>
        ))}
      </ul>
    </nav>
  );
}
