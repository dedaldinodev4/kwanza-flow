"use client";

import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui";
import { shiftMonth } from "@/lib/dates/iso";
import { useFormat } from "@/providers/use-format";

interface MonthSwitcherProps {
  month: string;
  currentMonth: string;
  onChange: (month: string) => void;
}


export function MonthSwitcher({ month, currentMonth, onChange }: MonthSwitcherProps) {
  const { t } = useTranslation();
  const { month: getMonth } = useFormat();

  return (
    <div role="group" aria-label={t("Month")} className="flex flex-wrap items-center gap-2">
      <Button
        className="cursor-pointer"
        variant="outline"
        size="icon"
        aria-label={t("Previous month")}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </Button>
      <p aria-live="polite" className="text-section min-w-36 text-center">
        {getMonth(month)}
      </p>
      <Button
        className="cursor-pointer"
        variant="outline"
        size="icon"
        aria-label={t("Next month")}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight aria-hidden className="size-4" />
      </Button>
      {month !== currentMonth && (
        <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => onChange(currentMonth)}>
          {t("Back to {{month}}", { month: getMonth(currentMonth) })}
        </Button>
      )}
    </div>
  );
}
