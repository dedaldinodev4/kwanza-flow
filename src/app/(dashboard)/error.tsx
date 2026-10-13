"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-card bg-card mx-auto mt-10 max-w-md border p-6 text-center"
    >
      <AlertTriangle aria-hidden className="text-warning mx-auto size-8" />
      <h1 className="text-section mt-3">Something went wrong</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        This page could not be displayed. Your data is stored in this browser and has not been
        changed.
      </p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
