import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: "/transactions" | "/budgets" | "/goals"; label: string };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-control flex flex-col items-center gap-2 border border-dashed px-4 py-8 text-center">
      <Icon aria-hidden className="text-muted-foreground size-6" />
      <p className="text-label">{title}</p>
      <p className="text-caption text-muted-foreground max-w-xs">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="rounded-control hover:bg-muted mt-2 inline-flex min-h-11 items-center border px-4 text-sm font-medium"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
