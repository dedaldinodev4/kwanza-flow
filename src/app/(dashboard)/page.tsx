import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Your money at a glance." />
      <section
        aria-label="Status"
        className="rounded-card bg-card text-muted-foreground shadow-card border p-6 text-sm"
      >
        This section is scheduled for Phase 2. The shell and navigation are complete.
      </section>
    </div>
  );
}
