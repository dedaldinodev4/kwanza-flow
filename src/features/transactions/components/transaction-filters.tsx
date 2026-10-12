"use client";

import { Search } from "lucide-react";
import { useId, type Dispatch } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import type { QueryAction } from "../hooks/use-transaction-query";
import {
  SORT_OPTIONS,
  type QueryResult,
  type SortKey,
  type TransactionQuery,
} from "../utils/transaction-query";

interface TransactionFiltersProps {
  query: TransactionQuery;
  dispatch: Dispatch<QueryAction>;
  result: QueryResult;
}

export function TransactionFilters({ query, dispatch, result }: TransactionFiltersProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const categories = CATEGORIES.filter((c) => query.type === "all" || c.type === query.type);

  return (
    <section aria-label="Search and filters" className="space-y-4">
      <div>
        <Label htmlFor={id("search")}>Search description</Label>
        <div className="relative">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            id={id("search")}
            type="search"
            autoComplete="off"
            placeholder="e.g. supermarket"
            className="pl-9"
            value={query.search}
            onChange={(e) => dispatch({ type: "search", value: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor={id("type")}>Type</Label>
          <Select
            id={id("type")}
            value={query.type}
            onChange={(e) =>
              dispatch({ type: "filter-type", value: e.target.value as TransactionQuery["type"] })
            }
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </Select>
        </div>
        <div>
          <Label htmlFor={id("category")}>Category</Label>
          <Select
            id={id("category")}
            value={query.categoryId}
            onChange={(e) => dispatch({ type: "filter-category", value: e.target.value })}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={id("from")}>From</Label>
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
          <Label htmlFor={id("to")}>To</Label>
          <Input
            id={id("to")}
            type="date"
            value={query.to}
            min={query.from || undefined}
            aria-invalid={!!result.rangeError}
            onChange={(e) => dispatch({ type: "to", value: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={id("sort")}>Sort by</Label>
          <Select
            id={id("sort")}
            value={query.sort}
            onChange={(e) => dispatch({ type: "sort", value: e.target.value as SortKey })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {result.rangeError && (
        <p role="alert" className="text-caption text-destructive font-medium">
          {result.rangeError}
        </p>
      )}

      {result.hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={() => dispatch({ type: "clear" })}>
          Clear filters
        </Button>
      )}
    </section>
  );
}
