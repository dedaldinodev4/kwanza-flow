import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "transition-ui w-full rounded-control border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:bg-disabled aria-invalid:border-destructive";


export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        CONTROL,
        "h-11 appearance-none bg-size-[16px] bg-position-[right_0.75rem_center] bg-no-repeat pr-9",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a978f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

