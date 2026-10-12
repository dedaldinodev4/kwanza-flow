"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { formatMonth } from "@/lib/formatters/date";
import { shiftMonth } from "@/lib/dates/iso";

interface MonthSwitcherProps {
  month: string;
  currentMonth: string;
  onChange: (month: string) => void;
}


export function MonthSwitcher({ month, currentMonth, onChange }: MonthSwitcherProps) {
  return (
    <div role="group" aria-label="Month" className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </Button>
      <p aria-live="polite" className="text-section min-w-36 text-center">
        {formatMonth(month)}
      </p>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight aria-hidden className="size-4" />
      </Button>
      {month !== currentMonth && (
        <Button variant="ghost" size="sm" onClick={() => onChange(currentMonth)}>
          Back to {formatMonth(currentMonth)}
        </Button>
      )}
    </div>
  );
}
