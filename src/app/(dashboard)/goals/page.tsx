import type { Metadata } from "next";
import { GoalsView } from "@/features/goals/components/goals-view";

export const metadata: Metadata = { title: "Savings goals" };

export default function GoalsPage() {
  return <GoalsView />;
}
