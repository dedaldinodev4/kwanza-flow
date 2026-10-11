import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Profile, formatting, and appearance." />
      <section
        aria-label="Status"
        className="rounded-card bg-card text-muted-foreground shadow-card border p-6 text-sm"
      >
        This section is scheduled for Phase 5. The shell and navigation are complete.
      </section>
    </div>
  );
}
