"use client";

import { useId, useState, type Dispatch } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, Search } from "lucide-react";

import { Button, Input, Label, Select } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import type { QueryAction } from "../hooks/use-transaction-query";
import {
  SORT_OPTIONS,
  type QueryResult,
  type SortKey,
  type TransactionQuery,
} from "../utils/transaction-query";
import { cn } from "@/lib/utils";

interface TransactionFiltersProps {
  query: TransactionQuery;
  dispatch: Dispatch<QueryAction>;
  result: QueryResult;
}

export function TransactionFilters({ query, dispatch, result }: TransactionFiltersProps) {
  const { t } = useTranslation();
  const uid = useId();
  const [expanded, setExpanded] = useState(false);
  // Sorting is not a filter, so it does not count toward the badge.
  const activeCount = [
    query.type !== "all",
    query.categoryId !== "all",
    query.from !== "",
    query.to !== "",
  ].filter(Boolean).length;

  const id = (name: string) => `${uid}-${name}`;
  const categories = CATEGORIES.filter((c) => query.type === "all" || c.type === query.type);

  return (
    <section aria-label={t("Search and filters")} className="space-y-4">
      <div>
        <Label htmlFor={id("search")}>{t("Search description")}</Label>
        <div className="relative">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            id={id("search")}
            type="search"
            autoComplete="off"
            placeholder={t("e.g. supermarket")}
            className="pl-9"
            value={query.search}
            onChange={(e) => dispatch({ type: "search", value: e.target.value })}
          />
        </div>
      </div>

      {/* Phones: a toggle keeps the transactions near the top. From `sm` up the controls are always shown. */}
      <Button
        variant="outline"
        size="sm"
        className="sm:hidden cursor-pointer"
        aria-expanded={expanded}
        aria-controls={id("panel")}
        onClick={() => setExpanded((open) => !open)}
      >
        <SlidersHorizontal aria-hidden className="size-4" />
        {t("Filters and sorting")}
        {activeCount > 0 && (
          <span className="bg-success text-primary-foreground rounded-full px-1.5 text-xs">
            {activeCount}
            <span className="sr-only"> {t("active")}</span>
          </span>
        )}
      </Button>

      <div
        id={id("panel")}
        className={cn(expanded ? "grid" : "hidden", "grid-cols-2 gap-4 sm:grid lg:grid-cols-5")}
      >
        <div>
          <Label htmlFor={id("type")}>{t("Type")}</Label>
          <Select
            id={id("type")}
            value={query.type}
            onChange={(e) =>
              dispatch({ type: "filter-type", value: e.target.value as TransactionQuery["type"] })
            }
          >
            <option value="all">{t("All types")}</option>
            <option value="income">{t("Income")}</option>
            <option value="expense">{t("Expenses")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor={id("category")}>{t("Category")}</Label>
          <Select
            id={id("category")}
            value={query.categoryId}
            onChange={(e) => dispatch({ type: "filter-category", value: e.target.value })}
          >
            <option value="all">{t("All categories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.name)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={id("from")}>{t("From")}</Label>
          <Input
            id={id("from")}
            type="date"
            value={query.from}
            max={query.to || undefined}
            aria-invalid={!!result.rangeError}
            onChange={(e) => dispatch({ type: "from", value: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={id("to")}>{t("To")}</Label>
          <Input
            id={id("to")}
            type="date"
            value={query.to}
            min={query.from || undefined}
            aria-invalid={!!result.rangeError}
            onChange={(e) => dispatch({ type: "to", value: e.target.value })}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor={id("sort")}>{t("Sort by")}</Label>
          <Select
            id={id("sort")}
            value={query.sort}
            onChange={(e) => dispatch({ type: "sort", value: e.target.value as SortKey })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {result.rangeError && (
        <p role="alert" className="text-caption text-destructive font-medium">
          {t(result.rangeError)}
        </p>
      )}

      {result.hasActiveFilters && (
        <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => dispatch({ type: "clear" })}>
          {t("Clear filters")}
        </Button>
      )}
    </section>
  );
}
