import { compareTransactionsNewestFirst } from "@/lib/calculations";
import type { Transaction, TransactionType } from "@/types/domain";

export const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high to low" },
  { value: "amount-asc", label: "Amount: low to high" },
  { value: "description-asc", label: "Description: A to Z" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 10;

export interface TransactionQuery {
  search: string;
  type: "all" | TransactionType;
  categoryId: "all" | string;
  from: string;  /** Inclusive ISO dates; "" means unbounded. */
  to: string;  /** Inclusive ISO dates; "" means unbounded. */
  sort: SortKey;
  page: number;
  pageSize: number;
}

export const DEFAULT_QUERY: TransactionQuery = {
  search: "",
  type: "all",
  categoryId: "all",
  from: "",
  to: "",
  sort: "date-desc",
  page: 1,
  pageSize: PAGE_SIZE,
};

export interface QueryResult {
  items: Transaction[];
  totalMatches: number;
  page: number;
  pageCount: number;
  firstIndex: number;
  lastIndex: number;
  rangeError: string | null;
  hasActiveFilters: boolean;
}

//* normalizeText - Lower-case and strip accents so "cafe" finds "Café" *//
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const COMPARATORS: Record<SortKey, (a: Transaction, b: Transaction) => number> = {
  "date-desc": compareTransactionsNewestFirst,
  "date-asc": (a, b) =>
    a.date.localeCompare(b.date) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id),
  "amount-desc": (a, b) => b.amount - a.amount,
  "amount-asc": (a, b) => a.amount - b.amount,
  "description-asc": (a, b) =>
    normalizeText(a.description).localeCompare(normalizeText(b.description)),
};

export function hasActiveFilters(q: TransactionQuery): boolean {
  return (
    q.search.trim() !== "" ||
    q.type !== "all" ||
    q.categoryId !== "all" ||
    q.from !== "" ||
    q.to !== ""
  );
}

//* Search → filter → sort → paginate, as one pure function. *//
export function queryTransactions(
  transactions: readonly Transaction[],
  q: TransactionQuery,
): QueryResult {
  const active = hasActiveFilters(q);
  const rangeError =
    q.from && q.to && q.from > q.to ? "The start date must be on or before the end date." : null;

  const needle = normalizeText(q.search);
  const matches = rangeError
    ? []
    : transactions.filter(
      (t) =>
        (q.type === "all" || t.type === q.type) &&
        (q.categoryId === "all" || t.categoryId === q.categoryId) &&
        (!q.from || t.date >= q.from) &&
        (!q.to || t.date <= q.to) &&
        (needle === "" || normalizeText(t.description).includes(needle)),
    );

  const primary = COMPARATORS[q.sort];
  const sorted = [...matches].sort((a, b) => primary(a, b) || compareTransactionsNewestFirst(a, b));

  const pageSize = Math.max(1, q.pageSize);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(q.page) || 1), pageCount);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return {
    items,
    totalMatches: sorted.length,
    page,
    pageCount,
    firstIndex: items.length === 0 ? 0 : start + 1,
    lastIndex: start + items.length,
    rangeError,
    hasActiveFilters: active,
  };
}
