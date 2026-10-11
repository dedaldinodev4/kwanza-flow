"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { isPeriodId, type PeriodId } from "@/lib/dates/periods";

export const DEFAULT_PERIOD: PeriodId = "this-month";

/**
 * The selected period lives in the URL (?period=last-month): it survives reloads, can be shared,
 * and the back button behaves. Anything unrecognised falls back to the default instead of crashing.
 */
export function usePeriodParam(): [PeriodId, (next: PeriodId) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get("period");
  const period = isPeriodId(raw) ? raw : DEFAULT_PERIOD;

  const setPeriod = useCallback(
    (next: PeriodId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [period, setPeriod];
}
