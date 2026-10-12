import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}


export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-4">
      <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft aria-hidden className="size-4" />
        Previous
      </Button>
      <p className="text-muted-foreground text-sm">
        Page {page} of {pageCount}
      </p>
      <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
        Next
        <ChevronRight aria-hidden className="size-4" />
      </Button>
    </nav>
  );
}
