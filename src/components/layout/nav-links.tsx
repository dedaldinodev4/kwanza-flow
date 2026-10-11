"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, NAV_ITEMS } from "./nav-items";

interface NavLinksProps {
  variant: "sidebar" | "tabbar";
}

/** The only client piece of the shell: it needs `usePathname` for the active indicator. */
export function NavLinks({ variant }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className={cn(variant === "sidebar" ? "flex flex-col gap-1" : "grid grid-cols-5")}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "transition-ui flex items-center",
                variant === "sidebar" &&
                  cn(
                    "rounded-control min-h-11 gap-3 px-3 text-sm font-medium",
                    active
                      ? "bg-sidebar-active text-sidebar-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground",
                  ),
                variant === "tabbar" &&
                  cn(
                    "min-h-16 flex-col justify-center gap-1 text-[0.6875rem] font-medium",
                    active ? "text-success" : "text-muted-foreground hover:text-foreground",
                  ),
              )}
            >
              <Icon aria-hidden className="size-5 shrink-0" />
              <span>{label}</span>
              {variant === "sidebar" && active && (
                <span aria-hidden className="bg-brand ml-auto size-1.5 rounded-full" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
