import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AddTransactionButton } from "@/features/transactions/components/add-transaction-button";
import { DashboardSkeleton, DashboardView } from "@/features/dashboard/components/dashboard-view";

import { message } from "@/i18n/utils";


export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={message("Overview")}
        description={message("Understand your money. Control your spending. Plan your future.")}
        actions={<AddTransactionButton />}
      />
      {/* useSearchParams (the period selector) needs a Suspense boundary in statically rendered routes. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardView />
      </Suspense>
    </div>
  );
}
