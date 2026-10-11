import { cn } from "@/lib/utils";


export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("rounded-control bg-muted motion-safe:animate-pulse", className)}
    />
  );
}
