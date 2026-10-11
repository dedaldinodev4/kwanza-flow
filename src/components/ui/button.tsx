import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";


export const buttonVariants = cva(
  "transition-ui inline-flex shrink-0 items-center justify-center gap-2 rounded-control text-sm font-medium whitespace-nowrap disabled:pointer-events-none disabled:bg-disabled disabled:text-muted-foreground",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        outline: "border border-input bg-card hover:bg-muted",
        ghost: "hover:bg-muted",
        destructive: "bg-destructive text-white hover:opacity-90 dark:text-[#0b1411]",
      },
      size: {
        default: "min-h-11 px-4",
        sm: "min-h-9 px-3",
        icon: "size-11",
      },
    },
    defaultVariants: { 
      variant: "primary", 
      size: "default" 
    },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
