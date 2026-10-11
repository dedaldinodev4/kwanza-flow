import { cn } from "@/lib/utils";

/** Wordmark: a simple geometric mark plus the product name. No decorative extras. */
export function Brand({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="bg-brand grid size-8 place-items-center rounded-control text-sm font-bold text-[#0b1411]"
      >
        K
      </span>
      <span
        className={cn(
          "text-base font-semibold tracking-tight",
          onDark ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        KwanzaFlow
      </span>
    </div>
  );
}
