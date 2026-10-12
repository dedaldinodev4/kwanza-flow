"use client";

import { useReducer } from "react";
import { getCategory } from "@/lib/categories";
import { DEFAULT_QUERY, type SortKey, type TransactionQuery } from "../utils/transaction-query";

export type QueryAction =
  | { type: "search"; value: string }
  | { type: "filter-type"; value: TransactionQuery["type"] }
  | { type: "filter-category"; value: string }
  | { type: "from"; value: string }
  | { type: "to"; value: string }
  | { type: "sort"; value: SortKey }
  | { type: "page"; value: number }
  | { type: "clear" };

/** Changing any filter or the sort returns to page 1; only the "page" action moves between pages. */
export function queryReducer(state: TransactionQuery, action: QueryAction): TransactionQuery {
  switch (action.type) {
    case "search":
      return { ...state, search: action.value, page: 1 };
    case "filter-type": {
      // A category belongs to one type, so keep the two filters from contradicting each other.
      const categoryFits =
        state.categoryId === "all" ||
        action.value === "all" ||
        getCategory(state.categoryId)?.type === action.value;
      return {
        ...state,
        type: action.value,
        categoryId: categoryFits ? state.categoryId : "all",
        page: 1,
      };
    }
    case "filter-category":
      return { ...state, categoryId: action.value, page: 1 };
    case "from":
      return { ...state, from: action.value, page: 1 };
    case "to":
      return { ...state, to: action.value, page: 1 };
    case "sort":
      return { ...state, sort: action.value, page: 1 };
    case "page":
      return { ...state, page: action.value };
    case "clear":
      // Keep the sort order and page size: they are preferences, not filters.
      return { ...DEFAULT_QUERY, sort: state.sort, pageSize: state.pageSize };
  }
}

export function useTransactionQuery() {
  return useReducer(queryReducer, DEFAULT_QUERY);
}
