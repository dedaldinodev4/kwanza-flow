"use client";

import { useId } from "react";
import { PERIOD_IDS, PERIOD_LABELS, type PeriodId } from "@/lib/dates/periods";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  value: PeriodId;
  onChange: (next: PeriodId) => void;
  description: string;
}

export function PeriodSelector({ value, onChange, description }: PeriodSelectorProps) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Reporting period</legend>
      <div className="rounded-control bg-card grid grid-cols-2 gap-1 border p-1 sm:inline-grid sm:grid-flow-col">
        {PERIOD_IDS.map((id) => (
          <label key={id} className="relative">
            <input
              type="radio"
              name={name}
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "transition-ui flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-medium whitespace-nowrap",
                "text-muted-foreground hover:text-foreground",
                "peer-checked:bg-primary peer-checked:text-primary-foreground",
                "peer-focus-visible:outline-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
              )}
            >
              {PERIOD_LABELS[id]}
            </span>
          </label>
        ))}
      </div>
      <p aria-live="polite" className="text-caption text-muted-foreground mt-2">
        Showing {description}
      </p>
    </fieldset>
  );
}
