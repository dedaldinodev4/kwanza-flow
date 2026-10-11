import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** shadcn-style card primitives: 16px radius, 1px border, restrained shadow. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-card bg-card text-card-foreground shadow-card border p-4 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  titleId,
  description,
  action,
}: {
  title: string;
  titleId: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={titleId} className="text-section">
          {title}
        </h2>
        {description && <p className="text-caption text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
