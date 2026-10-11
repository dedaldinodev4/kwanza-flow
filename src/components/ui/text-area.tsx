import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "transition-ui w-full rounded-control border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:bg-disabled aria-invalid:border-destructive";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-24 py-2.5", className)} {...props} />;
}

