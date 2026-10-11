import { monthOf, monthRange, monthsBetween, shiftMonth } from "@/lib/dates/iso";
import type { AppData, Budget, SavingsGoal, Transaction, TransactionType } from "@/types/domain";


interface Template {
  slug: string;
  type: TransactionType;
  description: string;
  categoryId: string;
  day: number;
  amountKz: number;
  //* ± percentage variation applied per month (0 = fixed). *//
  variance: number;
  //* Only generated in months where this predicate holds (deterministic). *//
  when?: (monthIndex: number) => boolean;
}

const TEMPLATES: readonly Template[] = [
  {
    slug: "salary",
    type: "income",
    description: "Monthly salary",
    categoryId: "salary",
    day: 5,
    amountKz: 780_000,
    variance: 0,
  },
  {
    slug: "freelance",
    type: "income",
    description: "Freelance design project",
    categoryId: "freelance",
    day: 12,
    amountKz: 180_000,
    variance: 20,
    when: (i) => i % 3 === 0,
  },
  {
    slug: "rent",
    type: "expense",
    description: "Apartment rent",
    categoryId: "housing",
    day: 2,
    amountKz: 220_000,
    variance: 0,
  },
  {
    slug: "groceries-1",
    type: "expense",
    description: "Supermarket",
    categoryId: "groceries",
    day: 3,
    amountKz: 38_000,
    variance: 12,
  },
  {
    slug: "groceries-2",
    type: "expense",
    description: "Open-air market",
    categoryId: "groceries",
    day: 9,
    amountKz: 21_000,
    variance: 15,
  },
  {
    slug: "groceries-3",
    type: "expense",
    description: "Supermarket",
    categoryId: "groceries",
    day: 16,
    amountKz: 41_000,
    variance: 12,
  },
  {
    slug: "groceries-4",
    type: "expense",
    description: "Bakery and butcher",
    categoryId: "groceries",
    day: 23,
    amountKz: 19_500,
    variance: 15,
  },
  {
    slug: "transport-1",
    type: "expense",
    description: "Taxi rides",
    categoryId: "transport",
    day: 5,
    amountKz: 14_000,
    variance: 15,
  },
  {
    slug: "transport-2",
    type: "expense",
    description: "Fuel",
    categoryId: "transport",
    day: 12,
    amountKz: 22_000,
    variance: 10,
  },
  {
    slug: "transport-3",
    type: "expense",
    description: "Taxi rides",
    categoryId: "transport",
    day: 19,
    amountKz: 13_500,
    variance: 15,
  },
  {
    slug: "electricity",
    type: "expense",
    description: "Electricity (ENDE)",
    categoryId: "utilities",
    day: 8,
    amountKz: 18_000,
    variance: 10,
  },
  {
    slug: "water",
    type: "expense",
    description: "Water (EPAL)",
    categoryId: "utilities",
    day: 8,
    amountKz: 6_500,
    variance: 5,
  },
  {
    slug: "internet",
    type: "expense",
    description: "Internet and mobile data",
    categoryId: "utilities",
    day: 10,
    amountKz: 24_000,
    variance: 0,
  },
  {
    slug: "dining-1",
    type: "expense",
    description: "Lunch with colleagues",
    categoryId: "dining",
    day: 7,
    amountKz: 16_000,
    variance: 20,
  },
  {
    slug: "dining-2",
    type: "expense",
    description: "Family dinner",
    categoryId: "dining",
    day: 14,
    amountKz: 32_000,
    variance: 20,
  },
  {
    slug: "dining-3",
    type: "expense",
    description: "Coffee and snacks",
    categoryId: "dining",
    day: 21,
    amountKz: 12_500,
    variance: 20,
  },
  {
    slug: "pharmacy",
    type: "expense",
    description: "Pharmacy",
    categoryId: "health",
    day: 15,
    amountKz: 14_000,
    variance: 20,
    when: (i) => i % 2 === 0,
  },
  {
    slug: "course",
    type: "expense",
    description: "Online course",
    categoryId: "education",
    day: 6,
    amountKz: 45_000,
    variance: 0,
  },
  {
    slug: "cinema",
    type: "expense",
    description: "Cinema and outings",
    categoryId: "entertainment",
    day: 18,
    amountKz: 20_000,
    variance: 25,
  },
  {
    slug: "misc",
    type: "expense",
    description: "Household items",
    categoryId: "other-expense",
    day: 22,
    amountKz: 12_000,
    variance: 25,
  },
];

//* Monthly budget limits in Kz for the categories the demo user tracks. *//
const BUDGET_LIMITS_KZ: Readonly<Record<string, number>> = {
  groceries: 130_000,
  transport: 50_000,
  utilities: 50_000,
  dining: 55_000,
  entertainment: 20_000,
};

//* Small stable string hash (FNV-1a) → non-negative integer. *//
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

//* Applies ±variance% deterministically, rounds to the nearest Kz 500, returns minor units. *//
function varyAmount(amountKz: number, variance: number, seed: string): number {
  const offset = variance === 0 ? 0 : ((hash(seed) % 201) - 100) / 100; // −1.00 … +1.00
  const rounded = Math.max(
    500,
    Math.round((amountKz * (1 + (offset * variance) / 100)) / 500) * 500,
  );
  return rounded * 100;
}

function clampDay(month: string, day: number): number {
  return Math.min(day, Number(monthRange(month).end.slice(8, 10)));
}

//* From the earlier of 1 Jan of the reference year and five months back, through the reference month. *//
export function mockMonths(referenceDate: string): string[] {
  const refMonth = monthOf(referenceDate);
  const startOfYear = `${referenceDate.slice(0, 4)}-01`;
  const fiveBack = shiftMonth(refMonth, -5);
  return monthsBetween(startOfYear < fiveBack ? startOfYear : fiveBack, refMonth);
}

export function buildMockData(referenceDate: string): AppData {
  const refMonth = monthOf(referenceDate);
  const refDay = Number(referenceDate.slice(8, 10));
  const months = mockMonths(referenceDate);

  const transactions: Transaction[] = [];
  months.forEach((month, monthIndex) => {
    for (const t of TEMPLATES) {
      if (t.when && !t.when(monthIndex)) continue;
      const day = clampDay(month, t.day);
      if (month === refMonth && day > refDay) continue; // never generate future-dated demo data
      const date = `${month}-${String(day).padStart(2, "0")}`;
      const stamp = `${date}T08:00:00.000Z`;
      transactions.push({
        id: `txn-${month}-${t.slug}`,
        type: t.type,
        description: t.description,
        amount: varyAmount(t.amountKz, t.variance, `${month}|${t.slug}`),
        categoryId: t.categoryId,
        date,
        createdAt: stamp,
        updatedAt: stamp,
      });
    }
  });

  const budgets: Budget[] = months.flatMap((month) =>
    Object.entries(BUDGET_LIMITS_KZ).map(([categoryId, limitKz]) => {
      const stamp = `${month}-01T08:00:00.000Z`;
      return {
        id: `budget-${month}-${categoryId}`,
        categoryId,
        month,
        limit: limitKz * 100,
        createdAt: stamp,
        updatedAt: stamp,
      };
    }),
  );

  const stamp = `${referenceDate}T08:00:00.000Z`;
  const goals: SavingsGoal[] = [
    {
      id: "goal-emergency-fund",
      name: "Emergency fund",
      targetAmount: 2_000_000_00,
      currentAmount: 850_000_00,
      targetDate: `${shiftMonth(refMonth, 8)}-28`,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: "goal-benguela-trip",
      name: "Trip to Benguela",
      targetAmount: 450_000_00,
      currentAmount: 120_000_00,
      targetDate: `${shiftMonth(refMonth, 5)}-15`,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: "goal-laptop",
      name: "New laptop",
      targetAmount: 600_000_00,
      currentAmount: 600_000_00,
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];

  return {
    transactions,
    budgets,
    goals,
    preferences: {
      displayName: "Demo user",
      locale: "pt-AO",
      currency: "AOA",
      density: "comfortable",
      openingBalance: 1_500_000_00,
    },
  };
}
