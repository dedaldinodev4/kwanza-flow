import { cn } from "@/lib/utils";

export type ProgressTone = "ok" | "warning" | "over" | "complete";

const FILL: Record<ProgressTone, string> = {
  ok: "bg-success",
  complete: "bg-success",
  warning: "bg-warning",
  over: "bg-destructive",
};

interface ProgressBarProps {
  ratio: number;
  label: string;
  tone?: ProgressTone;
}

/** Fill colors were chosen for ≥3:1 contrast against the track in both themes. */
export function ProgressBar({ ratio, label, tone = "ok" }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.max(0, ratio) * 100)}
      className="bg-muted h-2 w-full overflow-hidden rounded-full"
    >
      <div
        className={cn(
          "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-200",
          FILL[tone],
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
