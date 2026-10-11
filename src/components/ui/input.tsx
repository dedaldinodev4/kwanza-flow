import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "transition-ui w-full rounded-control border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:bg-disabled aria-invalid:border-destructive";


export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-11", className)} {...props} />;
}




