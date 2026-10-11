import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/lib/locales";
import { MAX_MINOR_UNITS } from "@/constants";


const id = z.string().min(1).max(64);

//* date *//
export const isoDateSchema = z.iso.date();
export const isoMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");
const isoTimestamp = z.iso.datetime();

//* Money *//
const positiveMinor = z.int().min(1).max(MAX_MINOR_UNITS);
const nonNegativeMinor = z.int().min(0).max(MAX_MINOR_UNITS);

//*  TRANSACTION *//
export const transactionTypeSchema = z.enum(["income", "expense"]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const transactionSchema = z.object({
  id,
  type: transactionTypeSchema,
  description: z.string().trim().min(1).max(120),
  amount: positiveMinor,
  categoryId: id,
  date: isoDateSchema,
  notes: z.string().trim().max(500).optional(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});
export type Transaction = z.infer<typeof transactionSchema>;

//* CATEGORY *//
export const categorySchema = z.object({
  id,
  name: z.string().min(1).max(60),
  type: transactionTypeSchema,
});
export type Category = z.infer<typeof categorySchema>;

//* BUDGET *//
export const budgetSchema = z.object({
  id,
  categoryId: id,
  month: isoMonthSchema,
  limit: positiveMinor,
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});
export type Budget = z.infer<typeof budgetSchema>;

//* SAVING GOAL *//
export const savingsGoalSchema = z.object({
  id,
  name: z.string().trim().min(1).max(80),
  targetAmount: positiveMinor,
  currentAmount: nonNegativeMinor,
  targetDate: isoDateSchema.optional(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});
export type SavingsGoal = z.infer<typeof savingsGoalSchema>;

//* USER PREFERENCES *//
export const userPreferencesSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  locale: z.enum(SUPPORTED_LOCALES),
  currency: z.literal("AOA"),
  density: z.enum(["comfortable", "compact"]),
  openingBalance: z.int().min(-MAX_MINOR_UNITS).max(MAX_MINOR_UNITS),
});
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

//* APP DATA *//
export const appDataSchema = z.object({
  transactions: z.array(transactionSchema),
  budgets: z.array(budgetSchema),
  goals: z.array(savingsGoalSchema),
  preferences: userPreferencesSchema,
});
export type AppData = z.infer<typeof appDataSchema>;
