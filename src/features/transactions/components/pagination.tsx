import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}


export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;
  return (
    <nav aria-label={t("Pagination")} className="flex items-center justify-between gap-3 pt-4">
      <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft aria-hidden className="size-4" />
        {t("Previous")}
      </Button>
      <p className="text-muted-foreground text-sm">
        {t("Page {{page}} of {{total}}", { page, total: pageCount })}
      </p>
      <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
        {t("Next")}
        <ChevronRight aria-hidden className="size-4" />
      </Button>
    </nav>
  );
}
