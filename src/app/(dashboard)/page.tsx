import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardSkeleton, DashboardView } from "@/features/dashboard/components/dashboard-view";


export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Understand your money. Control your spending. Plan your future."
      />
      {/* useSearchParams (the period selector) needs a Suspense boundary in statically rendered routes. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardView />
      </Suspense>
    </div>
  );
}
