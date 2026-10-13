"use client";

import { useAppData } from "@/providers/app-data-provider";


export function SidebarProfile() {
  const state = useAppData();
  if (state.status !== "ready") return <div aria-hidden className="h-10" />;
  const name = state.data.preferences.displayName;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <div className="mb-3 flex items-center gap-3 px-2">
      <span
        aria-hidden
        className="bg-sidebar-active text-sidebar-foreground grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
      >
        {initials}
      </span>
      <div className="min-w-0">
        <p className="text-sidebar-foreground truncate text-sm font-medium">{name}</p>
        <p className="text-sidebar-muted text-caption">Demo profile</p>
      </div>
    </div>
  );
}
